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

  const categories = await prisma.category.findMany({
    where: { ledgerId, parentId: null },
    include: {
      children: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(categories);
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

  const { name, type, color, parentId, sortOrder } = await request.json();

  if (!name || typeof name !== "string") {
    return new NextResponse("Name is required", { status: 400 });
  }
  if (!type || !["expense", "income"].includes(type)) {
    return new NextResponse("Type must be expense or income", { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      ledgerId,
      name,
      type,
      color: color || null,
      parentId: parentId || null,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    },
  });

  return NextResponse.json(category);
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

  const { id, name, type, color, parentId, sortOrder } = await request.json();

  if (!id) {
    return new NextResponse("ID is required", { status: 400 });
  }

  const existing = await prisma.category.findFirst({
    where: { id, ledgerId },
  });

  if (!existing) {
    return new NextResponse("Category not found", { status: 404 });
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(color !== undefined && { color: color || null }),
      ...(parentId !== undefined && { parentId: parentId || null }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  return NextResponse.json(category);
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

  const existing = await prisma.category.findFirst({
    where: { id, ledgerId },
  });

  if (!existing) {
    return new NextResponse("Category not found", { status: 404 });
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
