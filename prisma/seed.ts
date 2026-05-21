import { PrismaClient } from "../src/generated/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create demo user: demo@flowledger.com / 123456
  const passwordHash = await bcrypt.hash("123456", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@flowledger.com" },
    update: {},
    create: { name: "演示用户", email: "demo@flowledger.com", passwordHash },
  });

  // Create ledger
  const ledger = await prisma.ledger.upsert({
    where: { id: "demo-ledger" },
    update: {},
    create: { id: "demo-ledger", name: "我的账本", type: "family", ownerId: user.id },
  });

  // Create member
  await prisma.ledgerMember.upsert({
    where: { userId_ledgerId: { userId: user.id, ledgerId: ledger.id } },
    update: {},
    create: { userId: user.id, ledgerId: ledger.id, role: "owner" },
  });

  // Default categories
  const expenseCats = ["餐饮", "交通", "购物", "住房", "娱乐", "医疗", "教育", "其他"];
  const incomeCats = ["工资", "兼职", "投资", "红包", "其他"];

  for (const name of expenseCats) {
    await prisma.category.upsert({
      where: { id: `cat-expense-${name}` },
      update: {},
      create: { id: `cat-expense-${name}`, name, type: "expense", ledgerId: ledger.id },
    });
  }
  for (const name of incomeCats) {
    await prisma.category.upsert({
      where: { id: `cat-income-${name}` },
      update: {},
      create: { id: `cat-income-${name}`, name, type: "income", ledgerId: ledger.id },
    });
  }

  // Default accounts
  const accounts = [
    { name: "现金", type: "cash", balance: 5000 },
    { name: "银行卡", type: "bank", balance: 50000 },
    { name: "支付宝", type: "alipay", balance: 10000 },
    { name: "微信", type: "wechat", balance: 3000 },
  ];
  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { id: `acc-${acc.name}` },
      update: {},
      create: {
        id: `acc-${acc.name}`,
        ...acc,
        initialBalance: acc.balance,
        ledgerId: ledger.id,
      },
    });
  }

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => prisma.$disconnect());
