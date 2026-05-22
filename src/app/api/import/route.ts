import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateImportTransaction, type ImportTransaction } from "@/lib/import-validation";

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

  // Pre-validate all transactions
  const validated: { tx: ImportTransaction }[] = [];
  let failedCount = 0;

  for (const tx of transactions) {
    const validation = validateImportTransaction(tx as ImportTransaction);
    if (validation.success) {
      validated.push({ tx: tx as ImportTransaction });
    } else {
      failedCount++;
    }
  }

  // Process valid transactions atomically
  await prisma.$transaction(async (txClient: any) => {
    for (const { tx: txData } of validated) {
      const { type, amount, date, note, categoryId, accountId, toAccountId, merchant } = txData;
      await txClient.transaction.create({
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

      if (type === "expense" && accountId) {
        await txClient.account.update({
          where: { id: accountId },
          data: { balance: { decrement: amount } },
        });
      } else if (type === "income" && accountId) {
        await txClient.account.update({
          where: { id: accountId },
          data: { balance: { increment: amount } },
        });
      } else if (type === "transfer" && accountId && toAccountId) {
        await txClient.account.update({
          where: { id: accountId },
          data: { balance: { decrement: amount } },
        });
        await txClient.account.update({
          where: { id: toAccountId },
          data: { balance: { increment: amount } },
        });
      }
    }
  });

  return NextResponse.json({
    successCount: validated.length,
    failedCount,
  });
}
