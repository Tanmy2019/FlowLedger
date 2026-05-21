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

  const templates = await prisma.template.findMany({
    where: { ledgerId },
    include: {
      category: { select: { id: true, name: true, type: true, color: true } },
      account: { select: { id: true, name: true, type: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(templates);
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

  const { name, type, amount, categoryId, accountId } = await request.json();

  if (!name || typeof name !== "string") {
    return new NextResponse("Name is required", { status: 400 });
  }
  if (!type || !["expense", "income", "transfer"].includes(type)) {
    return new NextResponse("Type must be expense, income, or transfer", {
      status: 400,
    });
  }

  const template = await prisma.template.create({
    data: {
      ledgerId,
      name,
      type,
      amount: typeof amount === "number" ? amount : null,
      categoryId: categoryId || null,
      accountId: accountId || null,
    },
  });

  return NextResponse.json(template);
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

  const existing = await prisma.template.findFirst({
    where: { id, ledgerId },
  });

  if (!existing) {
    return new NextResponse("Template not found", { status: 404 });
  }

  await prisma.template.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
