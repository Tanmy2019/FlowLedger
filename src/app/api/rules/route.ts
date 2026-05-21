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

  const rules = await prisma.rule.findMany({
    where: { ledgerId },
    orderBy: { priority: "desc" },
  });

  const parsed = rules.map((rule) => ({
    ...rule,
    conditions: JSON.parse(rule.conditions),
  }));

  return NextResponse.json(parsed);
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

  const { name, matchMode, conditions, actionCategoryId } =
    await request.json();

  if (!name || typeof name !== "string") {
    return new NextResponse("Name is required", { status: 400 });
  }
  if (!matchMode || !["all", "any"].includes(matchMode)) {
    return new NextResponse("matchMode must be all or any", { status: 400 });
  }
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return new NextResponse("conditions must be a non-empty array", {
      status: 400,
    });
  }

  const rule = await prisma.rule.create({
    data: {
      ledgerId,
      name,
      matchMode,
      conditions: JSON.stringify(conditions),
      actionCategoryId: actionCategoryId || null,
    },
  });

  return NextResponse.json({
    ...rule,
    conditions: JSON.parse(rule.conditions),
  });
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

  const existing = await prisma.rule.findFirst({
    where: { id, ledgerId },
  });

  if (!existing) {
    return new NextResponse("Rule not found", { status: 404 });
  }

  await prisma.rule.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
