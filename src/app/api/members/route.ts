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
