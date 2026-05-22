import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, getDefaultLedger } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ledgerId = await getDefaultLedger(session.user.id, searchParams.get("ledgerId"));
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const body = await request.json();
  const { ids, updates } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array is required" }, { status: 400 });
  }

  if (!updates || typeof updates !== "object") {
    return NextResponse.json({ error: "updates object is required" }, { status: 400 });
  }

  // Only allow updating specific fields
  const allowedFields = ["categoryId", "accountId"];
  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in updates) {
      data[field] = updates[field] || null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no valid fields to update" }, { status: 400 });
  }

  // Verify transactions belong to this ledger
  const existing = await prisma.transaction.count({
    where: { id: { in: ids }, ledgerId },
  });

  if (existing === 0) {
    return NextResponse.json({ error: "transactions not found" }, { status: 404 });
  }

  const result = await prisma.transaction.updateMany({
    where: { id: { in: ids }, ledgerId },
    data,
  });

  return NextResponse.json({ count: result.count });
}
