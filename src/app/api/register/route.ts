import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码为必填项" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
      },
    });

    const ledger = await prisma.ledger.create({
      data: {
        name: "我的账本",
        ownerId: user.id,
      },
    });

    await prisma.ledgerMember.create({
      data: {
        userId: user.id,
        ledgerId: ledger.id,
        role: "owner",
      },
    });

    const expenseCategories = ["餐饮", "交通", "购物", "住房", "娱乐"];
    for (const catName of expenseCategories) {
      await prisma.category.create({
        data: {
          ledgerId: ledger.id,
          name: catName,
          type: "expense",
        },
      });
    }

    const incomeCategories = ["工资", "兼职", "投资", "红包", "其他"];
    for (const catName of incomeCategories) {
      await prisma.category.create({
        data: {
          ledgerId: ledger.id,
          name: catName,
          type: "income",
        },
      });
    }

    const accounts = ["现金", "银行卡", "支付宝", "微信"];
    for (const accountName of accounts) {
      await prisma.account.create({
        data: {
          ledgerId: ledger.id,
          name: accountName,
          type: "cash",
          balance: 0,
          initialBalance: 0,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后再试" },
      { status: 500 }
    );
  }
}
