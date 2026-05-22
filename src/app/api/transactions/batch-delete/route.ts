import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, getDefaultLedger } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ledgerId = await getDefaultLedger(session.user.id);
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array is required" }, { status: 400 });
  }

  // 查询所有待删除交易（仅限当前账本）
  const transactions = await prisma.transaction.findMany({
    where: { id: { in: ids }, ledgerId },
  });

  if (transactions.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  // 在事务中：先回滚余额，再批量删除
  await prisma.$transaction(async (tx) => {
    for (const oldTx of transactions) {
      // REVERT balance changes（与单个 DELETE 逻辑一致）
      if (oldTx.type === "expense" && oldTx.accountId) {
        await tx.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { increment: oldTx.amount } },
        });
      } else if (oldTx.type === "income" && oldTx.accountId) {
        await tx.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { decrement: oldTx.amount } },
        });
      } else if (oldTx.type === "transfer") {
        if (oldTx.accountId) {
          await tx.account.update({
            where: { id: oldTx.accountId },
            data: { balance: { increment: oldTx.amount } },
          });
        }
        if (oldTx.toAccountId && oldTx.toAccountId !== oldTx.accountId) {
          await tx.account.update({
            where: { id: oldTx.toAccountId },
            data: { balance: { decrement: oldTx.amount } },
          });
        }
      }
    }

    // 先删除关联的标签（deleteMany 不触发 cascade）
    await tx.transactionTag.deleteMany({
      where: { transactionId: { in: ids } },
    });

    await tx.transaction.deleteMany({
      where: { id: { in: ids }, ledgerId },
    });
  });

  return NextResponse.json({ count: transactions.length });
}
