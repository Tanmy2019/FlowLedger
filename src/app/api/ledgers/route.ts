import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const memberships = await prisma.ledgerMember.findMany({
    where: { userId: session.user.id },
    include: {
      ledger: {
        select: { id: true, name: true, type: true, color: true },
      },
    },
  });

  return NextResponse.json(memberships.map((m) => m.ledger));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return new NextResponse("Name is required", { status: 400 });
  }

  const ledger = await prisma.ledger.create({
    data: {
      name,
      ownerId: session.user.id,
      type: "personal",
      color: "#3b82f6",
      members: {
        create: {
          userId: session.user.id,
          role: "owner",
        },
      },
    },
  });

  return NextResponse.json(ledger);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ledgerId = searchParams.get("ledgerId");
  if (!ledgerId) {
    return new NextResponse("ledgerId is required", { status: 400 });
  }

  // 验证当前用户是该账本的所有者
  const member = await prisma.ledgerMember.findFirst({
    where: { userId: session.user.id, ledgerId },
  });

  if (!member || member.role !== "owner") {
    return new NextResponse("Ledger not found", { status: 404 });
  }

  // 删除账本（外键 Cascade 配置会自动清理关联数据）
  await prisma.ledger.delete({ where: { id: ledgerId } });

  return NextResponse.json({ success: true });
}
