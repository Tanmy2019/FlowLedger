import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, getDefaultLedger } from "@/lib/db";


export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ledgerId = await getDefaultLedger(session.user.id);
  if (!ledgerId) {
    return NextResponse.json({
      totalAssets: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      monthlyBalance: 0,
      yearlyIncome: 0,
      yearlyExpense: 0,
      yearlyBalance: 0,
      changePercent: 0,
      categoryData: [],
      incomeCategoryData: [],
      trendData: [],
    });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // 1. Total assets
  const accounts = await prisma.account.findMany({
    where: { ledgerId },
    select: { balance: true, type: true },
  });

  const totalAssets = accounts.reduce((sum, a) => {
    if (a.type === "liability" || a.type === "credit") {
      return sum - a.balance;
    }
    return sum + a.balance;
  }, 0);

  // 2. Current month aggregation + category data
  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      ledgerId,
      date: { gte: monthStart },
      type: { in: ["income", "expense"] },
    },
    select: {
      type: true,
      amount: true,
      categoryId: true,
      category: { select: { id: true, name: true, color: true } },
    },
  });

  const monthlyIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Expense category data
  const expenseCategoryMap = new Map<
    string,
    { name: string; color: string | null; value: number }
  >();
  monthlyTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const catId = t.categoryId || "uncategorized";
      if (!expenseCategoryMap.has(catId)) {
        expenseCategoryMap.set(catId, {
          name: t.category?.name || "未分类",
          color: t.category?.color || null,
          value: 0,
        });
      }
      expenseCategoryMap.get(catId)!.value += t.amount;
    });

  const categoryData = Array.from(expenseCategoryMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.value - a.value);

  // Income category data
  const incomeCategoryMap = new Map<
    string,
    { name: string; color: string | null; value: number }
  >();
  monthlyTransactions
    .filter((t) => t.type === "income")
    .forEach((t) => {
      const catId = t.categoryId || "uncategorized";
      if (!incomeCategoryMap.has(catId)) {
        incomeCategoryMap.set(catId, {
          name: t.category?.name || "未分类",
          color: t.category?.color || null,
          value: 0,
        });
      }
      incomeCategoryMap.get(catId)!.value += t.amount;
    });

  const incomeCategoryData = Array.from(incomeCategoryMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.value - a.value);

  // 3. Yearly aggregation
  const yearlyTransactions = await prisma.transaction.findMany({
    where: {
      ledgerId,
      date: { gte: yearStart },
      type: { in: ["income", "expense"] },
    },
    select: { type: true, amount: true },
  });

  const yearlyIncome = yearlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const yearlyExpense = yearlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // 4. Month-over-month change percent
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const lastMonthTransactions = await prisma.transaction.findMany({
    where: {
      ledgerId,
      date: { gte: lastMonthStart, lte: lastMonthEnd },
      type: "income",
    },
    select: { amount: true },
  });

  const lastMonthIncome = lastMonthTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );
  const changePercent =
    lastMonthIncome > 0
      ? ((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100
      : monthlyIncome > 0
        ? 100
        : 0;

  // 5. Trend data: last 6 months
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const trendTransactions = await prisma.transaction.findMany({
    where: {
      ledgerId,
      date: { gte: sixMonthsAgo },
      type: { in: ["income", "expense"] },
    },
    select: { type: true, amount: true, date: true },
  });

  const trendMap = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trendMap.set(key, { income: 0, expense: 0 });
  }

  trendTransactions.forEach((t) => {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    if (trendMap.has(key)) {
      const entry = trendMap.get(key)!;
      if (t.type === "income") entry.income += t.amount;
      else entry.expense += t.amount;
    }
  });

  const trendData = Array.from(trendMap.entries()).map(([month, data]) => ({
    month,
    income: data.income,
    expense: data.expense,
  }));

  return NextResponse.json({
    totalAssets: Math.round(totalAssets * 100) / 100,
    monthlyIncome: Math.round(monthlyIncome * 100) / 100,
    monthlyExpense: Math.round(monthlyExpense * 100) / 100,
    monthlyBalance: Math.round((monthlyIncome - monthlyExpense) * 100) / 100,
    yearlyIncome: Math.round(yearlyIncome * 100) / 100,
    yearlyExpense: Math.round(yearlyExpense * 100) / 100,
    yearlyBalance: Math.round((yearlyIncome - yearlyExpense) * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    categoryData,
    incomeCategoryData,
    trendData,
  });
}
