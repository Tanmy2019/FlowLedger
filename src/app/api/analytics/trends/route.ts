import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, getDefaultLedger } from "@/lib/db";

const MAX_AMOUNT = 1_000_000_000_000;
const isValidAmount = (n: number) => isFinite(n) && n > 0 && n < MAX_AMOUNT;


export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ledgerId = await getDefaultLedger(session.user.id, searchParams.get("ledgerId"));
  if (!ledgerId) {
    return NextResponse.json({ monthlyData: [], dailyExpense: [] });
  }

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // 1. Monthly data (last 12 months)
  const transactions = await prisma.transaction.findMany({
    where: {
      ledgerId,
      date: { gte: twelveMonthsAgo },
      type: { in: ["income", "expense"] },
    },
    select: { type: true, amount: true, date: true },
    orderBy: { date: "asc" },
  });

  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { income: 0, expense: 0 });
  }

  transactions
    .filter((t) => isValidAmount(t.amount))
    .forEach((t) => {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      const entry = monthlyMap.get(key)!;
      if (t.type === "income") entry.income += t.amount;
      else entry.expense += t.amount;
    }
  });

  const monthlyData = Array.from(monthlyMap.entries()).map(
    ([month, data]) => ({
      month,
      income: Math.round(data.income * 100) / 100,
      expense: Math.round(data.expense * 100) / 100,
    }),
  );

  // 2. Daily expense data (last 30 days)
  const thirtyDaysAgo = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 29,
  );

  const dailyTransactions = await prisma.transaction.findMany({
    where: {
      ledgerId,
      date: { gte: thirtyDaysAgo },
      type: "expense",
    },
    select: { amount: true, date: true },
    orderBy: { date: "asc" },
  });

  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dailyMap.set(key, 0);
  }

  dailyTransactions
    .filter((t) => isValidAmount(t.amount))
    .forEach((t) => {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}-${String(t.date.getDate()).padStart(2, "0")}`;
    if (dailyMap.has(key)) {
      dailyMap.set(key, dailyMap.get(key)! + t.amount);
    }
  });

  const dailyExpense = Array.from(dailyMap.entries()).map(
    ([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }),
  );

  return NextResponse.json({ monthlyData, dailyExpense });
}
