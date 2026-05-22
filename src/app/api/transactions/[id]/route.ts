import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, getDefaultLedger } from "@/lib/db";
import { transactionSchema } from "@/lib/validations";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const ledgerId = await getDefaultLedger(session.user.id, searchParams.get("ledgerId"));
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id, ledgerId },
    include: {
      category: { select: { id: true, name: true, type: true, color: true } },
      account: { select: { id: true, name: true, type: true } },
      toAccount: { select: { id: true, name: true, type: true } },
      tags: {
        include: { tag: { select: { id: true, name: true, color: true } } },
      },
    },
  });

  if (!transaction) {
    return new NextResponse("Transaction not found", { status: 404 });
  }

  return NextResponse.json(transaction);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const { searchParams } = new URL(request.url);
  const ledgerId = await getDefaultLedger(session.user.id, searchParams.get("ledgerId"));
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const body = await request.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Find old transaction
  const oldTx = await prisma.transaction.findFirst({
    where: { id, ledgerId },
    include: { tags: true },
  });

  if (!oldTx) {
    return new NextResponse("Transaction not found", { status: 404 });
  }

  const {
    type, amount, date, note, categoryId, accountId,
    toAccountId, merchant, tagIds, memberId, project,
  } = parsed.data;

  const operations: Array<unknown> = [];

  // 1. REVERT old balance changes
  if (oldTx.type === "expense" && oldTx.accountId) {
    operations.push(
      prisma.account.update({
        where: { id: oldTx.accountId },
        data: { balance: { increment: oldTx.amount } },
      })
    );
  } else if (oldTx.type === "income" && oldTx.accountId) {
    operations.push(
      prisma.account.update({
        where: { id: oldTx.accountId },
        data: { balance: { decrement: oldTx.amount } },
      })
    );
  } else if (oldTx.type === "transfer") {
    if (oldTx.accountId) {
      operations.push(
        prisma.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { increment: oldTx.amount } },
        })
      );
    }
    if (oldTx.toAccountId && oldTx.toAccountId !== oldTx.accountId) {
      operations.push(
        prisma.account.update({
          where: { id: oldTx.toAccountId },
          data: { balance: { decrement: oldTx.amount } },
        })
      );
    }
  }

  // 2. APPLY new balance changes
  if (type === "expense" && accountId) {
    operations.push(
      prisma.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      })
    );
  } else if (type === "income" && accountId) {
    operations.push(
      prisma.account.update({
        where: { id: accountId },
        data: { balance: { increment: amount } },
      })
    );
  } else if (type === "transfer") {
    if (accountId) {
      operations.push(
        prisma.account.update({
          where: { id: accountId },
          data: { balance: { decrement: amount } },
        })
      );
    }
    if (toAccountId && toAccountId !== accountId) {
      operations.push(
        prisma.account.update({
          where: { id: toAccountId },
          data: { balance: { increment: amount } },
        })
      );
    }
  }

  // 3. Update transaction (with tag replacement)
  operations.push(
    prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount,
        date: new Date(date),
        note: note || null,
        categoryId: categoryId || null,
        accountId: accountId || null,
        toAccountId: toAccountId || null,
        memberId: memberId || null,
        merchant: merchant || null,
        project: project || null,
        ...(tagIds !== undefined
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true, type: true, color: true } },
        account: { select: { id: true, name: true, type: true } },
        toAccount: { select: { id: true, name: true, type: true } },
        tags: {
          include: { tag: { select: { id: true, name: true, color: true } } },
        },
      },
    })
  );

  const results = await prisma.$transaction(operations as any);
  const transaction = results[results.length - 1];

  return NextResponse.json(transaction);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const { searchParams } = new URL(request.url);
  const ledgerId = await getDefaultLedger(session.user.id, searchParams.get("ledgerId"));
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const oldTx = await prisma.transaction.findFirst({
    where: { id, ledgerId },
  });

  if (!oldTx) {
    return new NextResponse("Transaction not found", { status: 404 });
  }

  const operations: Array<unknown> = [];

  // REVERT balance changes
  if (oldTx.type === "expense" && oldTx.accountId) {
    operations.push(
      prisma.account.update({
        where: { id: oldTx.accountId },
        data: { balance: { increment: oldTx.amount } },
      })
    );
  } else if (oldTx.type === "income" && oldTx.accountId) {
    operations.push(
      prisma.account.update({
        where: { id: oldTx.accountId },
        data: { balance: { decrement: oldTx.amount } },
      })
    );
  } else if (oldTx.type === "transfer") {
    if (oldTx.accountId) {
      operations.push(
        prisma.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { increment: oldTx.amount } },
        })
      );
    }
    if (oldTx.toAccountId && oldTx.toAccountId !== oldTx.accountId) {
      operations.push(
        prisma.account.update({
          where: { id: oldTx.toAccountId },
          data: { balance: { decrement: oldTx.amount } },
        })
      );
    }
  }

  // Delete transaction (cascade deletes TransactionTag)
  operations.push(prisma.transaction.delete({ where: { id } }));

  await prisma.$transaction(operations as any);

  return NextResponse.json({ success: true });
}
