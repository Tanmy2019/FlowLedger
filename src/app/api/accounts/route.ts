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

  const accounts = await prisma.account.findMany({
    where: { ledgerId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(accounts);
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

  const { name, type, initialBalance, color, sortOrder } = await request.json();

  if (!name || typeof name !== "string") {
    return new NextResponse("Name is required", { status: 400 });
  }

  const validTypes = [
    "cash",
    "bank",
    "credit",
    "alipay",
    "wechat",
    "investment",
    "liability",
  ];
  if (!type || !validTypes.includes(type)) {
    return new NextResponse("Invalid account type", { status: 400 });
  }

  const account = await prisma.account.create({
    data: {
      ledgerId,
      name,
      type,
      initialBalance: typeof initialBalance === "number" ? initialBalance : 0,
      balance: typeof initialBalance === "number" ? initialBalance : 0,
      color: color || null,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    },
  });

  return NextResponse.json(account);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ledgerId = await getDefaultLedger(session.user.id);
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const { id, name, type, initialBalance, color, sortOrder } =
    await request.json();

  if (!id) {
    return new NextResponse("ID is required", { status: 400 });
  }

  const existing = await prisma.account.findFirst({
    where: { id, ledgerId },
  });

  if (!existing) {
    return new NextResponse("Account not found", { status: 404 });
  }

  const account = await prisma.account.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(initialBalance !== undefined && { initialBalance }),
      ...(color !== undefined && { color: color || null }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  return NextResponse.json(account);
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

  const existing = await prisma.account.findFirst({
    where: { id, ledgerId },
  });

  if (!existing) {
    return new NextResponse("Account not found", { status: 404 });
  }

  await prisma.account.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
