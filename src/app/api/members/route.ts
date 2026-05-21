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

  const members = await prisma.ledgerMember.findMany({
    where: { ledgerId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(members);
}
