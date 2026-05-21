import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { transactionSchema } from "@/lib/validations";

async function getDefaultLedger(userId: string) {
  const member = await prisma.ledgerMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
  });
  return member?.ledgerId;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ledgerId = await getDefaultLedger(session.user.id);
  if (!ledgerId) {
    return NextResponse.json({ transactions: [], total: 0, page: 1, limit: 50 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50"), 1), 200);
  const type = searchParams.get("type");
  const categoryId = searchParams.get("categoryId");
  const accountId = searchParams.get("accountId");
  const search = searchParams.get("search");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = { ledgerId };

  if (type && ["expense", "income", "transfer"].includes(type)) {
    where.type = type;
  }
  if (categoryId) where.categoryId = categoryId;
  if (accountId) {
    where.OR = [
      { accountId },
      { toAccountId: accountId },
    ];
  }
  if (search) {
    const searchFilter = {
      OR: [
        { note: { contains: search } },
        { merchant: { contains: search } },
      ],
    };
    // Merge with existing accountId OR if present
    if (where.OR) {
      const accountOr = where.OR;
      delete where.OR;
      where.AND = [
        { OR: accountOr },
        searchFilter,
      ];
    } else {
      where.OR = searchFilter.OR;
    }
  }
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate + "T23:59:59.999Z");
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, type: true, color: true } },
        account: { select: { id: true, name: true, type: true } },
        toAccount: { select: { id: true, name: true, type: true } },
        tags: {
          include: { tag: { select: { id: true, name: true, color: true } } },
        },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, limit });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ledgerId = await getDefaultLedger(session.user.id);
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const body = await request.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    type, amount, date, note, categoryId, accountId,
    toAccountId, merchant, tagIds, memberId, project,
  } = parsed.data;

  const operations: Array<unknown> = [];

  // 1. Handle balance changes
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

  // 2. Create transaction
  operations.push(
    prisma.transaction.create({
      data: {
        ledgerId,
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
        tags:
          tagIds && tagIds.length > 0
            ? { create: tagIds.map((tagId) => ({ tagId })) }
            : undefined,
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
