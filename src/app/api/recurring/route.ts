import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getDefaultLedger(userId: string) {
  const member = await prisma.ledgerMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
  });
  return member?.ledgerId;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ledgerId = await getDefaultLedger(session.user.id);
  if (!ledgerId) {
    return NextResponse.json([]);
  }

  const rules = await prisma.recurringRule.findMany({
    where: { ledgerId },
    include: {
      category: { select: { id: true, name: true, type: true, color: true } },
      account: { select: { id: true, name: true, type: true } },
    },
    orderBy: { nextRunDate: "asc" },
  });

  return NextResponse.json(rules);
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

  const {
    name,
    type,
    amount,
    categoryId,
    accountId,
    cronExpression,
    note,
  } = await request.json();

  if (!name || typeof name !== "string") {
    return new NextResponse("Name is required", { status: 400 });
  }
  if (!type || !["expense", "income", "transfer"].includes(type)) {
    return new NextResponse("Type must be expense, income, or transfer", {
      status: 400,
    });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return new NextResponse("Valid amount is required", { status: 400 });
  }
  if (!cronExpression) {
    return new NextResponse("Cron expression is required", { status: 400 });
  }

  const nextRunDate = new Date();
  nextRunDate.setDate(nextRunDate.getDate() + 1);

  const rule = await prisma.recurringRule.create({
    data: {
      ledgerId,
      name,
      type,
      amount,
      categoryId: categoryId || null,
      accountId: accountId || null,
      note: note || null,
      cronExpression,
      nextRunDate,
    },
  });

  return NextResponse.json(rule);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ledgerId = await getDefaultLedger(session.user.id);
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const { id } = await request.json();
  if (!id) {
    return new NextResponse("ID is required", { status: 400 });
  }

  const existing = await prisma.recurringRule.findFirst({
    where: { id, ledgerId },
  });

  if (!existing) {
    return new NextResponse("Recurring rule not found", { status: 404 });
  }

  await prisma.recurringRule.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
