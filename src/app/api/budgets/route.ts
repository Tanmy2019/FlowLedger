import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, getDefaultLedger } from "@/lib/db";


export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ledgerId = await getDefaultLedger(session.user.id, searchParams.get("ledgerId"));
  if (!ledgerId) {
    return NextResponse.json([]);
  }

  const budgets = await prisma.budget.findMany({
    where: { ledgerId },
    include: { category: { select: { id: true, name: true, color: true } } },
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const results = await Promise.all(
    budgets.map(async (budget) => {
      let startDate: Date;
      let endDate: Date;

      if (budget.period === "monthly") {
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      } else {
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      }

      const where: Record<string, unknown> = {
        ledgerId,
        type: "expense",
        date: { gte: startDate, lte: endDate },
      };

      if (budget.categoryId) {
        where.categoryId = budget.categoryId;
      }

      const spent = await prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
      });

      const totalSpent = spent._sum.amount ?? 0;
      const remaining = budget.amount - totalSpent;
      const usagePercent =
        budget.amount > 0
          ? Math.round((totalSpent / budget.amount) * 100)
          : 0;

      return {
        ...budget,
        spent: totalSpent,
        remaining,
        usagePercent,
      };
    })
  );

  return NextResponse.json(results);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ledgerId = await getDefaultLedger(session.user.id, searchParams.get("ledgerId"));
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const { name, amount, period, categoryId } = await request.json();

  if (!name || typeof name !== "string") {
    return new NextResponse("Name is required", { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return new NextResponse("Valid amount is required", { status: 400 });
  }
  if (!period || !["monthly", "yearly"].includes(period)) {
    return new NextResponse("Period must be monthly or yearly", {
      status: 400,
    });
  }

  const now = new Date();
  const startDate =
    period === "monthly"
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1);

  const budget = await prisma.budget.create({
    data: {
      ledgerId,
      name,
      amount,
      period,
      startDate,
      categoryId: categoryId || null,
    },
  });

  return NextResponse.json(budget);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ledgerId = await getDefaultLedger(session.user.id, searchParams.get("ledgerId"));
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const { id, name, amount, period, categoryId } = await request.json();

  if (!id) {
    return new NextResponse("ID is required", { status: 400 });
  }

  const existing = await prisma.budget.findFirst({
    where: { id, ledgerId },
  });

  if (!existing) {
    return new NextResponse("Budget not found", { status: 404 });
  }

  const budget = await prisma.budget.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(amount !== undefined && { amount }),
      ...(period !== undefined && { period }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
    },
  });

  return NextResponse.json(budget);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ledgerId = await getDefaultLedger(session.user.id, searchParams.get("ledgerId"));
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const { id } = await request.json();
  if (!id) {
    return new NextResponse("ID is required", { status: 400 });
  }

  const existing = await prisma.budget.findFirst({
    where: { id, ledgerId },
  });

  if (!existing) {
    return new NextResponse("Budget not found", { status: 404 });
  }

  await prisma.budget.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
