import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { ledgerId, transactions } = body;

  if (!ledgerId || !Array.isArray(transactions) || transactions.length === 0) {
    return new NextResponse("ledgerId and transactions array required", {
      status: 400,
    });
  }

  // Verify user is a member of this ledger
  const member = await prisma.ledgerMember.findFirst({
    where: { userId: session.user.id, ledgerId },
  });

  if (!member) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let successCount = 0;
  let failedCount = 0;

  for (const tx of transactions) {
    try {
      const {
        type,
        amount,
        date,
        note,
        categoryId,
        accountId,
        toAccountId,
        merchant,
      } = tx;

      if (!type || !["expense", "income", "transfer"].includes(type)) {
        failedCount++;
        continue;
      }
      if (typeof amount !== "number" || amount <= 0) {
        failedCount++;
        continue;
      }
      if (!date) {
        failedCount++;
        continue;
      }

      await prisma.transaction.create({
        data: {
          ledgerId,
          type,
          amount,
          date: new Date(date),
          note: note || null,
          categoryId: categoryId || null,
          accountId: accountId || null,
          toAccountId: toAccountId || null,
          merchant: merchant || null,
        },
      });

      // Update account balance
      if (type === "expense" && accountId) {
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: { decrement: amount } },
        });
      } else if (type === "income" && accountId) {
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: { increment: amount } },
        });
      } else if (type === "transfer" && accountId && toAccountId) {
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: { decrement: amount } },
        });
        await prisma.account.update({
          where: { id: toAccountId },
          data: { balance: { increment: amount } },
        });
      }

      successCount++;
    } catch {
      failedCount++;
    }
  }

  return NextResponse.json({ successCount, failedCount });
}
