# FlowLedger 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的多用户、多账本记账 Web 应用，包含流水管理、预算、统计分析和数据导入功能

**Architecture:** Next.js 15 全栈单体，Prisma + SQLite 存储，NextAuth v5 认证，单个 Docker 容器部署

**Tech Stack:** Next.js 15 (App Router), TypeScript, Prisma, SQLite (better-sqlite3), NextAuth v5, Tailwind CSS, Recharts, shadcn/ui, Docker

---

## 文件结构总览

```
flowledger/
├── prisma/
│   └── schema.prisma                    # 数据库 Schema
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # 根布局
│   │   ├── page.tsx                     # 重定向到 dashboard
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx               # 侧边栏 + 主内容区
│   │   │   ├── page.tsx                 # 仪表盘
│   │   │   ├── transactions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── accounts/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── budgets/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx             # 账本/成员管理
│   │   │       ├── templates/page.tsx
│   │   │       ├── rules/page.tsx
│   │   │       ├── import/page.tsx
│   │   │       └── profile/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       │   └── route.ts
│   │       ├── register/route.ts
│   │       ├── transactions/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── accounts/route.ts
│   │       ├── categories/route.ts
│   │       ├── budgets/route.ts
│   │       ├── tags/route.ts
│   │       ├── templates/route.ts
│   │       ├── rules/route.ts
│   │       ├── analytics/
│   │       │   ├── overview/route.ts
│   │       │   ├── trends/route.ts
│   │       │   └── categories/route.ts
│   │       ├── import/route.ts
│   │       ├── ledgers/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── members/route.ts
│   │       └── recurring/route.ts
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 组件
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── ledger-switcher.tsx
│   │   ├── transactions/
│   │   │   ├── transaction-form.tsx
│   │   │   ├── transaction-list.tsx
│   │   │   └── transaction-filters.tsx
│   │   ├── charts/
│   │   │   ├── pie-chart.tsx
│   │   │   ├── line-chart.tsx
│   │   │   ├── bar-chart.tsx
│   │   │   ├── calendar-heatmap.tsx
│   │   │   └── sankey-chart.tsx
│   │   ├── budgets/
│   │   │   ├── budget-card.tsx
│   │   │   └── budget-form.tsx
│   │   ├── analytics/
│   │   │   └── stats-cards.tsx
│   │   └── shared/
│   │       ├── empty-state.tsx
│   │       ├── confirm-dialog.tsx
│   │       └── page-header.tsx
│   ├── lib/
│   │   ├── db.ts                    # Prisma 客户端单例
│   │   ├── auth.ts                  # NextAuth 配置
│   │   ├── auth.config.ts           # Auth 配置
│   │   ├── utils.ts                 # 工具函数
│   │   └── validations.ts           # Zod schema
│   └── hooks/
│       └── use-ledger.ts
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

### Task 1: 项目初始化与依赖安装

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `src/app/globals.css`

- [ ] **Step 1: 创建 Next.js 项目**

```bash
cd e:\Code_Project\FlowLedger
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

- [ ] **Step 2: 安装核心依赖**

```bash
npm install prisma @prisma/client better-sqlite3 next-auth@beta @auth/prisma-adapter bcryptjs recharts date-fns zod uuid sonner
npm install -D @types/better-sqlite3 @types/bcryptjs @types/uuid
```

- [ ] **Step 3: 安装 shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button input label card dialog dropdown-menu select table toast separator avatar badge tabs progress sheet scroll-area
```

- [ ] **Step 4: 创建 utils.ts（shadcn 需要）**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

（shadcn 初始化时已安装 clsx 和 tailwind-merge）

- [ ] **Step 5: 添加 Toaster 到根布局**

```tsx
// src/app/layout.tsx
import { Toaster } from "sonner";
// ... 在 body 内添加 <Toaster />
```

- [ ] **Step 6: 配置 next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
```

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "chore: initialize Next.js project with dependencies"
```

---

### Task 2: 数据库 Schema 与 Prisma 配置

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

- [ ] **Step 1: 编写 Prisma Schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  name         String?
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  ledgers      LedgerMember[]
}

model Ledger {
  id        String   @id @default(cuid())
  name      String
  type      String   @default("family") // family/travel/business
  icon      String   @default("book")
  color     String   @default("#3B82F6")
  ownerId   String
  createdAt DateTime @default(now())
  members   LedgerMember[]
  transactions Transaction[]
  categories   Category[]
  accounts     Account[]
  budgets      Budget[]
  tags         Tag[]
  templates    Template[]
  recurringRules RecurringRule[]
  rules        Rule[]
}

model LedgerMember {
  id        String   @id @default(cuid())
  userId    String
  ledgerId  String
  role      String   @default("viewer") // owner/editor/viewer
  joinedAt  DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  ledger    Ledger   @relation(fields: [ledgerId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@unique([userId, ledgerId])
}

model Category {
  id        String     @id @default(cuid())
  ledgerId  String
  name      String
  parentId  String?
  type      String     // expense/income
  icon      String?
  color     String?
  sortOrder Int        @default(0)
  ledger    Ledger     @relation(fields: [ledgerId], references: [id], onDelete: Cascade)
  parent    Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryHierarchy")
  transactions Transaction[]
}

model Account {
  id             String   @id @default(cuid())
  ledgerId       String
  name           String
  type           String   // cash/bank/credit/alipay/wechat/investment/liability
  balance        Float    @default(0)
  initialBalance Float    @default(0)
  icon           String?
  color          String?
  sortOrder      Int      @default(0)
  ledger         Ledger   @relation(fields: [ledgerId], references: [id], onDelete: Cascade)
  transactionsFrom Transaction[] @relation("FromAccount")
  transactionsTo   Transaction[] @relation("ToAccount")
}

model Transaction {
  id          String   @id @default(cuid())
  ledgerId    String
  type        String   // expense/income/transfer
  amount      Float
  date        DateTime
  note        String?
  categoryId  String?
  accountId   String?
  toAccountId String?
  memberId    String?
  merchant    String?
  project     String?
  status      String   @default("confirmed") // confirmed/pending
  templateId  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  ledger      Ledger     @relation(fields: [ledgerId], references: [id], onDelete: Cascade)
  category    Category?  @relation(fields: [categoryId], references: [id])
  account     Account?   @relation("FromAccount", fields: [accountId], references: [id])
  toAccount   Account?   @relation("ToAccount", fields: [toAccountId], references: [id])
  member      LedgerMember? @relation(fields: [memberId], references: [id])
  tags        TransactionTag[]
}

model Tag {
  id        String   @id @default(cuid())
  ledgerId  String
  name      String
  color     String?
  ledger    Ledger   @relation(fields: [ledgerId], references: [id], onDelete: Cascade)
  transactions TransactionTag[]
}

model TransactionTag {
  transactionId String
  tagId         String
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  tag           Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([transactionId, tagId])
}

model Budget {
  id         String   @id @default(cuid())
  ledgerId   String
  name       String
  amount     Float
  period     String   // monthly/yearly/custom
  startDate  DateTime
  endDate    DateTime?
  categoryId String?
  type       String   @default("all") // necessary/discretionary/all
  ledger     Ledger   @relation(fields: [ledgerId], references: [id], onDelete: Cascade)
  category   Category? @relation(fields: [categoryId], references: [id])
}

model Template {
  id        String   @id @default(cuid())
  ledgerId  String
  name      String
  type      String   // expense/income/transfer
  amount    Float?
  categoryId String?
  accountId String?
  note      String?
  ledger    Ledger   @relation(fields: [ledgerId], references: [id], onDelete: Cascade)
}

model RecurringRule {
  id             String   @id @default(cuid())
  ledgerId       String
  name           String
  type           String   // expense/income/transfer
  amount         Float
  categoryId     String?
  accountId      String?
  note           String?
  cronExpression String
  nextRunDate    DateTime
  isActive       Boolean  @default(true)
  ledger         Ledger   @relation(fields: [ledgerId], references: [id], onDelete: Cascade)
}

model Rule {
  id              String  @id @default(cuid())
  ledgerId        String
  name            String
  conditions      String  // JSON string
  matchMode       String  @default("all") // all/any
  actionCategoryId String?
  actionTagIds    String? // JSON array
  actionAccountId String?
  priority        Int     @default(0)
  ledger          Ledger  @relation(fields: [ledgerId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: 生成 Prisma Client 与创建数据库**

```bash
cd e:\Code_Project\FlowLedger
npx prisma generate
npx prisma db push
```

- [ ] **Step 3: 创建 db.ts 客户端单例**

```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: add Prisma schema with all models"
```

---

### Task 3: 认证系统（NextAuth v5）

**Files:**
- Create: `src/lib/auth.config.ts`
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/api/register/route.ts`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/api/ledgers/route.ts` (初始化创建默认账本)

- [ ] **Step 1: 创建 auth 配置文件**

```typescript
// src/lib/auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
};
```

- [ ] **Step 2: 创建完整的 auth.ts**

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
```

- [ ] **Step 3: 创建 API routes**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

```typescript
// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { name, email, password } = await request.json();
  
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  // 为新用户创建默认账本
  const ledger = await prisma.ledger.create({
    data: {
      name: "我的账本",
      type: "family",
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

  // 创建默认分类和账户
  await createDefaults(ledger.id);

  return NextResponse.json({ success: true });
}

async function createDefaults(ledgerId: string) {
  const defaultCategories = [
    { name: "餐饮", type: "expense", icon: "utensils", color: "#EF4444" },
    { name: "交通", type: "expense", icon: "car", color: "#F59E0B" },
    { name: "购物", type: "expense", icon: "shopping-bag", color: "#EC4899" },
    { name: "住房", type: "expense", icon: "home", color: "#8B5CF6" },
    { name: "娱乐", type: "expense", icon: "gamepad", color: "#06B6D4" },
    { name: "工资", type: "income", icon: "briefcase", color: "#10B981" },
    { name: "其他收入", type: "income", icon: "plus-circle", color: "#6366F1" },
  ];

  await prisma.category.createMany({
    data: defaultCategories.map((c) => ({ ...c, ledgerId })),
  });

  const defaultAccounts = [
    { name: "现金", type: "cash", icon: "wallet", color: "#10B981" },
    { name: "银行卡", type: "bank", icon: "credit-card", color: "#3B82F6" },
    { name: "支付宝", type: "alipay", icon: "smartphone", color: "#06B6D4" },
    { name: "微信", type: "wechat", icon: "message-circle", color: "#10B981" },
  ];

  await prisma.account.createMany({
    data: defaultAccounts.map((a) => ({ ...a, ledgerId })),
  });
}
```

- [ ] **Step 4: 创建 auth 布局和页面**

```tsx
// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
```

```tsx
// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("邮箱或密码错误");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">FlowLedger</CardTitle>
        <p className="text-sm text-muted-foreground text-center">登录你的账户</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email">邮箱</label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="password">密码</label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full">登录</Button>
          <p className="text-sm text-center text-muted-foreground">
            还没有账号？<Link href="/register" className="text-primary underline">注册</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

```tsx
// src/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "注册失败");
    } else {
      router.push("/login");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">FlowLedger</CardTitle>
        <p className="text-sm text-muted-foreground text-center">创建新账户</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name">昵称</label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="email">邮箱</label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="password">密码</label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full">注册</Button>
          <p className="text-sm text-center text-muted-foreground">
            已有账号？<Link href="/login" className="text-primary underline">登录</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat: add authentication with NextAuth v5"
```

---

### Task 4: 主布局与导航

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/ledger-switcher.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/app/page.tsx`（重定向）
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 根布局添加 SessionProvider**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowLedger",
  description: "个人记账软件",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: 创建 Sidebar**

```tsx
// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LedgerSwitcher } from "./ledger-switcher";

const menuItems = [
  { href: "/dashboard", label: "仪表盘", icon: "📊" },
  { href: "/dashboard/transactions", label: "流水", icon: "💳" },
  { href: "/dashboard/accounts", label: "账户", icon: "🏦" },
  { href: "/dashboard/categories", label: "分类", icon: "🏷️" },
  { href: "/dashboard/budgets", label: "预算", icon: "💰" },
  { href: "/dashboard/analytics", label: "统计", icon: "📈" },
  { href: "/dashboard/settings", label: "设置", icon: "⚙️" },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col h-full bg-white border-r", className)}>
      <div className="p-4 border-b">
        <LedgerSwitcher />
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                pathname === item.href && "bg-accent text-accent-foreground"
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Button>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground">FlowLedger v1.0</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 LedgerSwitcher**

```tsx
// src/components/layout/ledger-switcher.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LedgerSwitcher() {
  const [ledgers, setLedgers] = useState<{ id: string; name: string }[]>([]);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    fetch("/api/ledgers").then((r) => r.json()).then((data) => {
      setLedgers(data);
      if (data.length > 0) setCurrent(data[0].id);
    });
  }, []);

  const handleChange = (val: string) => {
    setCurrent(val);
    window.location.reload();
  };

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue placeholder="选择账本" />
      </SelectTrigger>
      <SelectContent>
        {ledgers.map((l) => (
          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 4: 创建 Dashboard 布局**

```tsx
// src/app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 shrink-0">
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: 根路由重定向**

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 6: Ledgers API route**

```typescript
// src/app/api/ledgers/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ledgers = await prisma.ledger.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    select: { id: true, name: true, type: true, color: true },
  });

  return NextResponse.json(ledgers);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type } = await req.json();
  const ledger = await prisma.ledger.create({
    data: { name, type, ownerId: session.user.id },
  });

  await prisma.ledgerMember.create({
    data: { userId: session.user.id, ledgerId: ledger.id, role: "owner" },
  });

  return NextResponse.json(ledger, { status: 201 });
}
```

- [ ] **Step 7: 提交**

```bash
git add -A && git commit -m "feat: add dashboard layout with sidebar navigation"
```

---

### Task 5: 分类管理 CRUD

**Files:**
- Create: `src/app/api/categories/route.ts`
- Create: `src/app/(dashboard)/categories/page.tsx`
- Create: `src/app/(dashboard)/categories/category-form.tsx`

- [ ] **Step 1: Categories API**

```typescript
// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ledgerId = searchParams.get("ledgerId") || (await getDefaultLedger(session.user.id));

  const categories = await prisma.category.findMany({
    where: { ledgerId },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    include: { children: true },
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const category = await prisma.category.create({
    data: {
      ...body,
      ledgerId: body.ledgerId,
    },
  });

  return NextResponse.json(category, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...data } = await req.json();
  const category = await prisma.category.update({ where: { id }, data });

  return NextResponse.json(category);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

async function getDefaultLedger(userId: string) {
  const member = await prisma.ledgerMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
  });
  return member?.ledgerId;
}
```

- [ ] **Step 2: 分类管理页面**

```tsx
// src/app/(dashboard)/categories/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Category = {
  id: string; name: string; type: string; icon?: string; color?: string; parentId?: string; sortOrder: number;
  children?: Category[];
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", type: "expense", parentId: "", icon: "", color: "#3B82F6" });

  const loadCategories = async () => {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  };

  useEffect(() => { loadCategories(); }, []);

  const handleSave = async () => {
    const body = editing ? { id: editing.id, ...form } : form;
    const method = editing ? "PUT" : "POST";
    const res = await fetch("/api/categories", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast(editing ? "分类已更新" : "分类已创建");
      setOpen(false);
      setEditing(null);
      setForm({ name: "", type: "expense", parentId: "", icon: "", color: "#3B82F6" });
      loadCategories();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    toast("分类已删除");
    loadCategories();
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">分类管理</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({ name: "", type: "expense", parentId: "", icon: "", color: "#3B82F6" }); }}>
              新增分类
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "编辑分类" : "新增分类"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">名称</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">类型</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">支出</SelectItem>
                    <SelectItem value="income">收入</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">颜色</label>
                <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <Button onClick={handleSave} className="w-full">保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-red-500">支出分类</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {expenseCategories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || "#EF4444" }} />
                  <span>{cat.name}</span>
                  {cat.children?.map((c) => (
                    <span key={c.id} className="text-sm text-muted-foreground">/{c.name}</span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(cat); setForm({ name: cat.name, type: cat.type, parentId: "", icon: "", color: cat.color || "#3B82F6" }); setOpen(true); }}>
                    编辑
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(cat.id)}>
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-green-500">收入分类</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {incomeCategories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || "#10B981" }} />
                  <span>{cat.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(cat); setForm({ name: cat.name, type: cat.type, parentId: "", icon: "", color: cat.color || "#3B82F6" }); setOpen(true); }}>
                    编辑
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(cat.id)}>
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add categories CRUD"
```

---

### Task 6: 账户管理 CRUD

**Files:**
- Create: `src/app/api/accounts/route.ts`
- Create: `src/app/(dashboard)/accounts/page.tsx`

- [ ] **Step 1: Accounts API**（结构同 categories API，操作 Account 模型）

```typescript
// src/app/api/accounts/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const accountTypes = ["cash", "bank", "credit", "alipay", "wechat", "investment", "liability"];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ledgerId = searchParams.get("ledgerId") || (await getDefaultLedger(session.user.id));

  const accounts = await prisma.account.findMany({
    where: { ledgerId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const account = await prisma.account.create({ data: body });
  return NextResponse.json(account, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...data } = await req.json();
  const account = await prisma.account.update({ where: { id }, data });
  return NextResponse.json(account);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

async function getDefaultLedger(userId: string) {
  const member = await prisma.ledgerMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
  });
  return member?.ledgerId;
}
```

- [ ] **Step 2: 账户管理页面**

```tsx
// src/app/(dashboard)/accounts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Account = {
  id: string; name: string; type: string; balance: number; initialBalance: number; icon?: string; color?: string;
};

const typeLabels: Record<string, string> = {
  cash: "现金", bank: "银行卡", credit: "信用卡", alipay: "支付宝",
  wechat: "微信", investment: "投资账户", liability: "负债账户",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: "", type: "bank", initialBalance: 0, color: "#3B82F6" });

  const loadAccounts = async () => {
    const res = await fetch("/api/accounts");
    setAccounts(await res.json());
  };

  useEffect(() => { loadAccounts(); }, []);

  const handleSave = async () => {
    const body = editing ? { id: editing.id, ...form } : form;
    const method = editing ? "PUT" : "POST";
    const res = await fetch("/api/accounts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast(editing ? "账户已更新" : "账户已创建");
      setOpen(false);
      setEditing(null);
      loadAccounts();
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">账户管理</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>新增账户</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "编辑账户" : "新增账户"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">名称</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">类型</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">初始余额</label>
                <Input type="number" value={form.initialBalance} onChange={(e) => setForm({ ...form, initialBalance: Number(e.target.value) })} />
              </div>
              <Button onClick={handleSave} className="w-full">保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">{/* 总资产卡片 */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-4">
            <p className="text-sm opacity-80">总资产</p>
            <p className="text-3xl font-bold">¥{totalBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <Card key={acc.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color || "#3B82F6" }} />
                {acc.name}
                <span className="text-xs text-muted-foreground ml-1">{typeLabels[acc.type]}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">¥{acc.balance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">初始: ¥{acc.initialBalance.toLocaleString()}</p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => { setEditing(acc); setForm({ name: acc.name, type: acc.type, initialBalance: acc.initialBalance, color: acc.color || "#3B82F6" }); setOpen(true); }}>
                  编辑
                </Button>
                <Button variant="outline" size="sm" className="text-red-500" onClick={async () => {
                  if (!confirm("确定删除？")) return;
                  await fetch(`/api/accounts?id=${acc.id}`, { method: "DELETE" });
                  toast("账户已删除");
                  loadAccounts();
                }}>
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add accounts CRUD"
```

---

### Task 7: 标签管理

**Files:**
- Create: `src/app/api/tags/route.ts`
- Create: `src/app/(dashboard)/settings/tags/page.tsx`

- [ ] **Step 1: Tags API**

```typescript
// src/app/api/tags/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const ledgerId = searchParams.get("ledgerId") || (await getDefaultLedger(session.user.id));
  const tags = await prisma.tag.findMany({ where: { ledgerId }, orderBy: { name: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const tag = await prisma.tag.create({ data: body });
  return NextResponse.json(tag, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

async function getDefaultLedger(userId: string) {
  const member = await prisma.ledgerMember.findFirst({ where: { userId }, orderBy: { joinedAt: "asc" } });
  return member?.ledgerId;
}
```

- [ ] **Step 2: 提交**

```bash
git add -A && git commit -m "feat: add tags API"
```

---

### Task 8: 流水管理 CRUD

**Files:**
- Create: `src/app/api/transactions/route.ts`
- Create: `src/app/api/transactions/[id]/route.ts`
- Create: `src/app/(dashboard)/transactions/page.tsx`
- Create: `src/components/transactions/transaction-form.tsx`
- Create: `src/components/transactions/transaction-list.tsx`
- Create: `src/components/transactions/transaction-filters.tsx`
- Create: `src/lib/validations.ts`

- [ ] **Step 1: 创建 Zod 验证**

```typescript
// src/lib/validations.ts
import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["expense", "income", "transfer"]),
  amount: z.number().positive(),
  date: z.string(),
  note: z.string().optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  toAccountId: z.string().optional(),
  memberId: z.string().optional(),
  merchant: z.string().optional(),
  project: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});
```

- [ ] **Step 2: Transactions API**

```typescript
// src/app/api/transactions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { transactionSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ledgerId = searchParams.get("ledgerId") || (await getDefaultLedger(session.user.id));
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const type = searchParams.get("type");
  const categoryId = searchParams.get("categoryId");
  const accountId = searchParams.get("accountId");
  const search = searchParams.get("search");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: any = { ledgerId };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (accountId) where.accountId = accountId;
  if (search) where.OR = [
    { note: { contains: search } },
    { merchant: { contains: search } },
  ];
  if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
  if (endDate) where.date = { ...where.date, lte: new Date(endDate) };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { name: true, color: true, icon: true } },
        account: { select: { name: true } },
        toAccount: { select: { name: true } },
        tags: { include: { tag: { select: { name: true, color: true } } } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, limit });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = transactionSchema.parse(body);

  // 使用事务处理转账
  const transaction = await prisma.$transaction(async (tx) => {
    // 处理转账
    if (parsed.type === "transfer" && parsed.accountId && parsed.toAccountId) {
      await tx.account.update({
        where: { id: parsed.accountId },
        data: { balance: { decrement: parsed.amount } },
      });
      await tx.account.update({
        where: { id: parsed.toAccountId },
        data: { balance: { increment: parsed.amount } },
      });
    }

    // 处理收支（更新账户余额）
    if (parsed.type === "expense" && parsed.accountId) {
      await tx.account.update({
        where: { id: parsed.accountId },
        data: { balance: { decrement: parsed.amount } },
      });
    }
    if (parsed.type === "income" && parsed.accountId) {
      await tx.account.update({
        where: { id: parsed.accountId },
        data: { balance: { increment: parsed.amount } },
      });
    }

    const { tagIds, ...txData } = parsed;
    return tx.transaction.create({
      data: {
        ...txData,
        date: new Date(txData.date),
        tags: tagIds?.length
          ? { create: tagIds.map((tagId: string) => ({ tagId })) }
          : undefined,
      },
      include: {
        category: { select: { name: true, color: true } },
        account: { select: { name: true } },
        toAccount: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    });
  });

  return NextResponse.json(transaction, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, tagIds, ...data } = await req.json();

  const transaction = await prisma.$transaction(async (tx) => {
    // 获取原交易，恢复旧余额
    const old = await tx.transaction.findUnique({ where: { id } });
    if (old && old.accountId) {
      if (old.type === "expense") {
        await tx.account.update({ where: { id: old.accountId }, data: { balance: { increment: old.amount } } });
      } else if (old.type === "income") {
        await tx.account.update({ where: { id: old.accountId }, data: { balance: { decrement: old.amount } } });
      } else if (old.type === "transfer") {
        if (old.accountId) await tx.account.update({ where: { id: old.accountId }, data: { balance: { increment: old.amount } } });
        if (old.toAccountId) await tx.account.update({ where: { id: old.toAccountId }, data: { balance: { decrement: old.amount } } });
      }
    }

    // 应用新余额
    if (data.type === "expense" && data.accountId) {
      await tx.account.update({ where: { id: data.accountId }, data: { balance: { decrement: data.amount } } });
    } else if (data.type === "income" && data.accountId) {
      await tx.account.update({ where: { id: data.accountId }, data: { balance: { increment: data.amount } } });
    } else if (data.type === "transfer" && data.accountId && data.toAccountId) {
      await tx.account.update({ where: { id: data.accountId }, data: { balance: { decrement: data.amount } } });
      await tx.account.update({ where: { id: data.toAccountId }, data: { balance: { increment: data.amount } } });
    }

    // 更新标签
    if (tagIds) {
      await tx.transactionTag.deleteMany({ where: { transactionId: id } });
    }

    return tx.transaction.update({
      where: { id },
      data: {
        ...data,
        date: new Date(data.date),
        tags: tagIds ? { create: tagIds.map((tagId: string) => ({ tagId })) } : undefined,
      },
      include: {
        category: { select: { name: true, color: true } },
        account: { select: { name: true } },
        toAccount: { select: { name: true } },
        tags: { include: { tag: { select: { name: true, color: true } } } },
      },
    });
  });

  return NextResponse.json(transaction);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.findUnique({ where: { id } });
    if (t && t.accountId) {
      if (t.type === "expense") {
        await tx.account.update({ where: { id: t.accountId }, data: { balance: { increment: t.amount } } });
      } else if (t.type === "income") {
        await tx.account.update({ where: { id: t.accountId }, data: { balance: { decrement: t.amount } } });
      } else if (t.type === "transfer") {
        if (t.accountId) await tx.account.update({ where: { id: t.accountId }, data: { balance: { increment: t.amount } } });
        if (t.toAccountId) await tx.account.update({ where: { id: t.toAccountId }, data: { balance: { decrement: t.amount } } });
      }
    }
    await tx.transaction.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}

async function getDefaultLedger(userId: string) {
  const member = await prisma.ledgerMember.findFirst({ where: { userId }, orderBy: { joinedAt: "asc" } });
  return member?.ledgerId;
}
```

- [ ] **Step 3: 流水列表页面**

```tsx
// src/app/(dashboard)/transactions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

type Transaction = {
  id: string; type: string; amount: number; date: string; note?: string; merchant?: string;
  category?: { name: string; color: string };
  account?: { name: string };
  toAccount?: { name: string };
  tags: { tag: { name: string; color: string } }[];
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({ type: "", search: "", startDate: "", endDate: "" });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadTransactions = async () => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.search) params.set("search", filters.search);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions);
  };

  useEffect(() => { loadTransactions(); }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此流水？")) return;
    await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    loadTransactions();
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0 || !confirm(`确定删除 ${selected.size} 条流水？`)) return;
    await Promise.all([...selected].map((id) => fetch(`/api/transactions?id=${id}`, { method: "DELETE" })));
    setSelected(new Set());
    loadTransactions();
  };

  // 按日期分组
  const grouped: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    const dateKey = format(new Date(t.date), "yyyy-MM-dd");
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(t);
  });

  const typeSymbol = (type: string) => type === "expense" ? "↓" : type === "income" ? "↑" : "↔";
  const typeColor = (type: string) => type === "expense" ? "text-red-500" : type === "income" ? "text-green-500" : "text-blue-500";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">流水</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>记一笔</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "编辑流水" : "记一笔"}</DialogTitle></DialogHeader>
            <TransactionForm
              onSuccess={() => { setOpen(false); loadTransactions(); }}
              editData={editing}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
          <SelectTrigger className="w-28"><SelectValue placeholder="全部类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">全部</SelectItem>
            <SelectItem value="expense">支出</SelectItem>
            <SelectItem value="income">收入</SelectItem>
            <SelectItem value="transfer">转账</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="搜索备注/商家..."
          className="w-48"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Input type="date" className="w-36" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <Input type="date" className="w-36" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        {selected.size > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
            删除选中 ({selected.size})
          </Button>
        )}
      </div>

      {/* 流水列表 */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h3 className="text-sm text-muted-foreground mb-2">
              {format(new Date(date), "M月d日 EEEE", { locale: zhCN })}
            </h3>
            <div className="bg-white rounded-lg border divide-y">
              {items.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => {
                      const next = new Set(selected);
                      next.has(t.id) ? next.delete(t.id) : next.add(t.id);
                      setSelected(next);
                    }}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${typeColor(t.type)}`}>{typeSymbol(t.type)}</span>
                      <div>
                        <div className="font-medium">{t.note || t.category?.name || "未分类"}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.category && <span style={{ color: t.category.color }}>{t.category.name}</span>}
                          {t.account && <span> · {t.account.name}</span>}
                          {t.merchant && <span> · {t.merchant}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${typeColor(t.type)}`}>
                        {t.type === "expense" ? "-" : t.type === "income" ? "+" : ""}¥{t.amount.toLocaleString()}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setOpen(true); }}>编辑</Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(t.id)}>删除</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 创建 TransactionForm 组件**

```tsx
// src/components/transactions/transaction-form.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type FormData = {
  type: string; amount: number; date: string; note: string; categoryId: string;
  accountId: string; toAccountId: string; merchant: string; tagIds: string[];
};

export function TransactionForm({ onSuccess, editData }: {
  onSuccess: () => void;
  editData?: any;
}) {
  const [form, setForm] = useState<FormData>({
    type: "expense", amount: 0, date: new Date().toISOString().split("T")[0],
    note: "", categoryId: "", accountId: "", toAccountId: "", merchant: "", tagIds: [],
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
    fetch("/api/tags").then((r) => r.json()).then(setTags);
    if (editData) {
      setForm({
        type: editData.type, amount: editData.amount,
        date: new Date(editData.date).toISOString().split("T")[0],
        note: editData.note || "", categoryId: editData.categoryId || "",
        accountId: editData.accountId || "", toAccountId: editData.toAccountId || "",
        merchant: editData.merchant || "", tagIds: editData.tags?.map((t: any) => t.tagId) || [],
      });
    }
  }, [editData]);

  const handleSubmit = async () => {
    const method = editData ? "PUT" : "POST";
    const body = editData ? { id: editData.id, ...form } : form;
    const res = await fetch("/api/transactions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast(editData ? "流水已更新" : "流水已创建");
      onSuccess();
    } else {
      const err = await res.json();
      toast.error("保存失败", { description: err.error });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">类型</label>
        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">支出</SelectItem>
            <SelectItem value="income">收入</SelectItem>
            <SelectItem value="transfer">转账</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">金额</label>
        <Input type="number" step="0.01" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
      </div>
      <div>
        <label className="text-sm font-medium">分类</label>
        <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
          <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
          <SelectContent>
            {categories.filter((c) => c.type === form.type || (form.type === "transfer" && c.type === "expense")).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">{form.type === "transfer" ? "转出账户" : "账户"}</label>
        <Select value={form.accountId} onValueChange={(v) => setForm({ ...form, accountId: v })}>
          <SelectTrigger><SelectValue placeholder="选择账户" /></SelectTrigger>
          <SelectContent>
            {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {form.type === "transfer" && (
        <div>
          <label className="text-sm font-medium">转入账户</label>
          <Select value={form.toAccountId} onValueChange={(v) => setForm({ ...form, toAccountId: v })}>
            <SelectTrigger><SelectValue placeholder="选择账户" /></SelectTrigger>
            <SelectContent>
              {accounts.filter((a) => a.id !== form.accountId).map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <label className="text-sm font-medium">日期</label>
        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </div>
      <div>
        <label className="text-sm font-medium">备注</label>
        <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </div>
      <div>
        <label className="text-sm font-medium">商家</label>
        <Input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} />
      </div>
      <div>
        <label className="text-sm font-medium">标签</label>
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map((tag) => (
            <Button
              key={tag.id}
              variant={form.tagIds.includes(tag.id) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setForm({
                  ...form,
                  tagIds: form.tagIds.includes(tag.id)
                    ? form.tagIds.filter((id) => id !== tag.id)
                    : [...form.tagIds, tag.id],
                });
              }}
            >
              {tag.name}
            </Button>
          ))}
        </div>
      </div>
      <Button onClick={handleSubmit} className="w-full">保存</Button>
    </div>
  );
}
```

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat: add transactions CRUD with form and filters"
```

---

### Task 9: 仪表盘概览

**Files:**
- Create: `src/app/api/analytics/overview/route.ts`
- Create: `src/components/charts/pie-chart.tsx`
- Create: `src/components/charts/line-chart.tsx`
- Create: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Analytics API**

```typescript
// src/app/api/analytics/overview/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ledgerId = searchParams.get("ledgerId") || (await getDefaultLedger(session.user.id));
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [monthlyData, yearlyData, totalAssets, lastMonthData, categoryData, trendData] = await Promise.all([
    // 本月数据
    prisma.transaction.aggregate({
      where: { ledgerId, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    // 本年数据
    prisma.transaction.aggregate({
      where: { ledgerId, date: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    // 总资产
    prisma.account.aggregate({
      where: { ledgerId },
      _sum: { balance: true },
    }),
    // 上月数据
    prisma.transaction.aggregate({
      where: { ledgerId, date: { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), lt: startOfMonth } },
      _sum: { amount: true },
    }),
    // 分类汇总
    prisma.transaction.groupBy({
      by: ["categoryId", "type"],
      where: { ledgerId, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    // 近6月趋势
    prisma.transaction.findMany({
      where: { ledgerId, date: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
      select: { amount: true, type: true, date: true },
      orderBy: { date: "asc" },
    }),
  ]);

  // 计算月度收支
  const monthlyIncome = await prisma.transaction.aggregate({
    where: { ledgerId, type: "income", date: { gte: startOfMonth } },
    _sum: { amount: true },
  });
  const monthlyExpense = await prisma.transaction.aggregate({
    where: { ledgerId, type: "expense", date: { gte: startOfMonth } },
    _sum: { amount: true },
  });

  const lastMonthIncome = await prisma.transaction.aggregate({
    where: { ledgerId, type: "income", date: { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), lt: startOfMonth } },
    _sum: { amount: true },
  });

  const monthlyIncomeAmt = monthlyIncome._sum.amount || 0;
  const monthlyExpenseAmt = monthlyExpense._sum.amount || 0;
  const lastMonthIncomeAmt = lastMonthIncome._sum.amount || 0;

  const yearlyIncome = await prisma.transaction.aggregate({
    where: { ledgerId, type: "income", date: { gte: startOfYear } },
    _sum: { amount: true },
  });
  const yearlyExpense = await prisma.transaction.aggregate({
    where: { ledgerId, type: "expense", date: { gte: startOfYear } },
    _sum: { amount: true },
  });

  return NextResponse.json({
    totalAssets: totalAssets._sum.balance || 0,
    monthlyIncome: monthlyIncomeAmt,
    monthlyExpense: monthlyExpenseAmt,
    monthlyBalance: monthlyIncomeAmt - monthlyExpenseAmt,
    yearlyIncome: yearlyIncome._sum.amount || 0,
    yearlyExpense: yearlyExpense._sum.amount || 0,
    yearlyBalance: (yearlyIncome._sum.amount || 0) - (yearlyExpense._sum.amount || 0),
    changePercent: lastMonthIncomeAmt > 0 ? ((monthlyIncomeAmt - lastMonthIncomeAmt) / lastMonthIncomeAmt * 100).toFixed(1) : "0",
    categoryData,
    trendData: processTrendData(trendData),
  });
}

function processTrendData(data: any[]) {
  const monthly: Record<string, { income: number; expense: number }> = {};
  data.forEach((t) => {
    const key = t.date.toISOString().slice(0, 7);
    if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
    if (t.type === "income") monthly[key].income += t.amount;
    else if (t.type === "expense") monthly[key].expense += t.amount;
  });
  return Object.entries(monthly).map(([month, v]) => ({ month, ...v }));
}

async function getDefaultLedger(userId: string) {
  const member = await prisma.ledgerMember.findFirst({ where: { userId }, orderBy: { joinedAt: "asc" } });
  return member?.ledgerId;
}
```

- [ ] **Step 2: 仪表盘页面**

```tsx
// src/app/(dashboard)/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/analytics/overview").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div>加载中...</div>;

  return (
    <div className="space-y-6">
      {/* 2行5列卡片布局 */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="col-span-1 row-span-2 bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <CardContent className="py-6">
            <p className="text-sm opacity-80">总资产</p>
            <p className="text-2xl font-bold mt-1">¥{data.totalAssets.toLocaleString()}</p>
            <p className="text-xs opacity-60 mt-4">{data.changePercent}% 环比变化</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">本月收入</p>
            <p className="text-xl font-bold text-green-500">+¥{data.monthlyIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">本月支出</p>
            <p className="text-xl font-bold text-red-500">-¥{data.monthlyExpense.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">本月结余</p>
            <p className="text-xl font-bold">¥{data.monthlyBalance.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="col-span-1 row-span-2 bg-gradient-to-br from-purple-500 to-purple-700 text-white">
          <CardContent className="py-6">
            <p className="text-sm opacity-80">环比变化</p>
            <p className="text-3xl font-bold mt-1">{data.changePercent}%</p>
            <p className="text-xs opacity-60 mt-4">与上月对比</p>
          </CardContent>
        </Card>

        {/* 第二行 */}
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">本年收入</p>
            <p className="text-xl font-bold text-green-500">+¥{data.yearlyIncome?.toLocaleString() || "0"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">本年支出</p>
            <p className="text-xl font-bold text-red-500">-¥{data.yearlyExpense?.toLocaleString() || "0"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">本年结余</p>
            <p className="text-xl font-bold">¥{data.yearlyBalance?.toLocaleString() || "0"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add dashboard overview with analytics API"
```

---

### Task 10: 完整统计页面

**Files:**
- Create: `src/app/api/analytics/trends/route.ts`
- Create: `src/app/api/analytics/categories/route.ts`
- Create: `src/app/(dashboard)/analytics/page.tsx`
- Create: `src/components/charts/bar-chart.tsx`

- [ ] **Step 1: Trends API**

```typescript
// src/app/api/analytics/trends/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ledgerId = searchParams.get("ledgerId") || (await getDefaultLedger(session.user.id));
  const months = parseInt(searchParams.get("months") || "12");

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const transactions = await prisma.transaction.findMany({
    where: { ledgerId, date: { gte: startDate } },
    select: { amount: true, type: true, date: true },
    orderBy: { date: "asc" },
  });

  // 按月汇总
  const monthly: Record<string, { income: number; expense: number }> = {};
  const daily: Record<string, number> = {};

  transactions.forEach((t) => {
    const monthKey = t.date.toISOString().slice(0, 7);
    const dayKey = t.date.toISOString().slice(0, 10);

    if (!monthly[monthKey]) monthly[monthKey] = { income: 0, expense: 0 };
    if (t.type === "income") monthly[monthKey].income += t.amount;
    else if (t.type === "expense") monthly[monthKey].expense += t.amount;

    if (t.type === "expense") {
      daily[dayKey] = (daily[dayKey] || 0) + t.amount;
    }
  });

  return NextResponse.json({
    monthly: Object.entries(monthly).map(([month, v]) => ({ month, ...v })),
    daily: Object.entries(daily).map(([date, amount]) => ({ date, amount })),
  });
}

async function getDefaultLedger(userId: string) {
  const member = await prisma.ledgerMember.findFirst({ where: { userId }, orderBy: { joinedAt: "asc" } });
  return member?.ledgerId;
}
```

- [ ] **Step 2: 统计页面**

```tsx
// src/app/(dashboard)/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#14B8A6", "#6366F1"];

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/analytics/trends").then((r) => r.json()).then(setTrends);
    fetch("/api/analytics/overview").then((r) => r.json()).then((data) => {
      setCategoryData(data.categoryData || []);
    });
  }, []);

  const expenseCategories = categoryData.filter((c: any) => c.type === "expense");
  const incomeCategories = categoryData.filter((c: any) => c.type === "income");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">统计</h1>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="trends">趋势</TabsTrigger>
          <TabsTrigger value="categories">分类</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends?.monthly && (
              <Card>
                <CardHeader><CardTitle>收支趋势</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends.monthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#10B981" name="收入" />
                      <Line type="monotone" dataKey="expense" stroke="#EF4444" name="支出" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>支出分类占比</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      dataKey="_sum.amount"
                      nameKey="categoryId"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {expenseCategories.map((_: any, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4 mt-4">
          {trends?.monthly && (
            <Card>
              <CardHeader><CardTitle>月度收支对比</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={trends.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="#10B981" name="收入" />
                    <Bar dataKey="expense" fill="#EF4444" name="支出" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>支出分类</CardTitle></CardHeader>
              <CardContent>
                {expenseCategories.map((c: any, idx: number) => (
                  <div key={c.categoryId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span>{c.categoryId || "未分类"}</span>
                    </div>
                    <span className="font-medium">¥{(c._sum.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>收入分类</CardTitle></CardHeader>
              <CardContent>
                {incomeCategories.map((c: any, idx: number) => (
                  <div key={c.categoryId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span>{c.categoryId || "未分类"}</span>
                    <span className="font-medium">¥{(c._sum.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add analytics page with charts"
```

---

### Task 11: 预算管理

**Files:**
- Create: `src/app/api/budgets/route.ts`
- Create: `src/app/(dashboard)/budgets/page.tsx`
- Create: `src/components/budgets/budget-card.tsx`
- Create: `src/components/budgets/budget-form.tsx`

- [ ] **Step 1: Budgets API**

```typescript
// src/app/api/budgets/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ledgerId = searchParams.get("ledgerId") || (await getDefaultLedger(session.user.id));
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const budgets = await prisma.budget.findMany({
    where: { ledgerId },
    include: { category: { select: { name: true, color: true } } },
  });

  // 计算每个预算的当前使用额
  const budgetsWithUsage = await Promise.all(
    budgets.map(async (budget) => {
      const where: any = { ledgerId, date: { gte: startOfMonth } };
      if (budget.categoryId) where.categoryId = budget.categoryId;
      if (budget.period === "yearly") where.date.gte = new Date(now.getFullYear(), 0, 1);

      const agg = await prisma.transaction.aggregate({
        where: { ...where, type: "expense" },
        _sum: { amount: true },
      });

      return {
        ...budget,
        spent: agg._sum.amount || 0,
        remaining: budget.amount - (agg._sum.amount || 0),
        usagePercent: budget.amount > 0 ? Math.min(100, ((agg._sum.amount || 0) / budget.amount) * 100) : 0,
      };
    })
  );

  return NextResponse.json(budgetsWithUsage);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const budget = await prisma.budget.create({
    data: { ...body, startDate: new Date(body.startDate) },
  });
  return NextResponse.json(budget, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...data } = await req.json();
  const budget = await prisma.budget.update({
    where: { id },
    data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined },
  });
  return NextResponse.json(budget);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.budget.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

async function getDefaultLedger(userId: string) {
  const member = await prisma.ledgerMember.findFirst({ where: { userId }, orderBy: { joinedAt: "asc" } });
  return member?.ledgerId;
}
```

- [ ] **Step 2: 预算页面**

```tsx
// src/app/(dashboard)/budgets/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type Budget = {
  id: string; name: string; amount: number; spent: number; remaining: number;
  usagePercent: number; period: string; category?: { name: string; color: string };
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", amount: 0, period: "monthly", categoryId: "", startDate: new Date().toISOString().split("T")[0] });

  const loadBudgets = async () => {
    const res = await fetch("/api/budgets");
    setBudgets(await res.json());
  };

  useEffect(() => {
    loadBudgets();
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const handleSave = async () => {
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("预算已创建");
      setOpen(false);
      loadBudgets();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">预算</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>新增预算</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新增预算</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">名称</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">金额</label>
                <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium">周期</label>
                <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">每月</SelectItem>
                    <SelectItem value="yearly">每年</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">分类（可选）</label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => c.type === "expense").map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((budget) => {
          const isOver80 = budget.usagePercent >= 80;
          const isOver100 = budget.usagePercent >= 100;
          return (
            <Card key={budget.id} className={isOver100 ? "border-red-500" : isOver80 ? "border-yellow-500" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {budget.category && (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.category.color }} />
                  )}
                  {budget.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">¥{budget.spent.toLocaleString()} / ¥{budget.amount.toLocaleString()}</span>
                  <span className={`text-sm font-bold ${isOver100 ? "text-red-500" : isOver80 ? "text-yellow-500" : ""}`}>
                    {budget.usagePercent.toFixed(0)}%
                  </span>
                </div>
                <Progress value={budget.usagePercent} className={isOver100 ? "bg-red-200 [&>div]:bg-red-500" : isOver80 ? "[&>div]:bg-yellow-500" : ""} />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>剩余: ¥{budget.remaining.toLocaleString()}</span>
                  <Button variant="ghost" size="sm" className="text-red-500 h-auto p-0" onClick={async () => {
                    if (!confirm("确定删除？")) return;
                    await fetch(`/api/budgets?id=${budget.id}`, { method: "DELETE" });
                    toast("预算已删除");
                    loadBudgets();
                  }}>删除</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add budget management"
```

---

### Task 12: 设置页面与账本管理

**Files:**
- Create: `src/app/(dashboard)/settings/page.tsx`
- Create: `src/app/(dashboard)/settings/profile/page.tsx`
- Create: `src/app/(dashboard)/settings/templates/page.tsx`
- Create: `src/app/(dashboard)/settings/import/page.tsx`
- Create: `src/app/(dashboard)/settings/rules/page.tsx`
- Create: `src/app/api/templates/route.ts`
- Create: `src/app/api/rules/route.ts`
- Create: `src/app/api/members/route.ts`
- Create: `src/app/(dashboard)/settings/layout.tsx`

- [ ] **Step 1: 设置布局与页面**

```tsx
// src/app/(dashboard)/settings/layout.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

const settingsItems = [
  { href: "/dashboard/settings", label: "账本管理", icon: "📒" },
  { href: "/dashboard/settings/profile", label: "个人资料", icon: "👤" },
  { href: "/dashboard/settings/templates", label: "记账模板", icon: "📋" },
  { href: "/dashboard/settings/rules", label: "自动分类规则", icon: "🤖" },
  { href: "/dashboard/settings/import", label: "数据导入", icon: "📥" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6">
      <nav className="w-48 space-y-1 shrink-0">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Button>
          </Link>
        ))}
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: 账本管理页面**

```tsx
// src/app/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SettingsPage() {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "family" });

  const loadData = async () => {
    const [l, m] = await Promise.all([
      fetch("/api/ledgers").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]);
    setLedgers(l);
    setMembers(m);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/ledgers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("账本已创建");
      setOpen(false);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>账本管理</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>新建账本</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>新建账本</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="账本名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded p-2">
                  <option value="family">家庭账</option>
                  <option value="travel">旅行账</option>
                  <option value="business">生意账</option>
                </select>
                <Button onClick={handleCreate} className="w-full">创建</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ledgers.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="font-medium">{l.name}</span>
                  <span className="text-xs text-muted-foreground">{l.type}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>成员管理</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded bg-gray-50">
                <span>{m.user?.name || m.user?.email}</span>
                <span className="text-sm text-muted-foreground">{m.role === "owner" ? "拥有者" : m.role === "editor" ? "编辑者" : "查看者"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Members API**

```typescript
// src/app/api/members/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.ledgerMember.findFirst({ where: { userId: session.user.id }, orderBy: { joinedAt: "asc" } });
  if (!member) return NextResponse.json([]);

  const members = await prisma.ledgerMember.findMany({
    where: { ledgerId: member.ledgerId },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(members);
}
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: add settings pages with ledger and member management"
```

---

### Task 13: 记账模板 & 周期记账

**Files:**
- Create: `src/app/api/templates/route.ts`
- Create: `src/app/api/recurring/route.ts`
- Modify: `src/app/(dashboard)/settings/templates/page.tsx`

- [ ] **Step 1: Templates API**

```typescript
// src/app/api/templates/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const ledgerId = searchParams.get("ledgerId") || (await getDefaultLedger(session.user.id));
  const templates = await prisma.template.findMany({ where: { ledgerId }, orderBy: { name: "asc" } });
  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const template = await prisma.template.create({ data: body });
  return NextResponse.json(template, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.template.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

async function getDefaultLedger(userId: string) {
  const member = await prisma.ledgerMember.findFirst({ where: { userId }, orderBy: { joinedAt: "asc" } });
  return member?.ledgerId;
}
```

- [ ] **Step 2: 模板页面**

```tsx
// src/app/(dashboard)/settings/templates/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/templates").then((r) => r.json()).then(setTemplates);
  }, []);

  return (
    <Card>
      <CardHeader><CardTitle>记账模板</CardTitle></CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <p className="text-muted-foreground">暂无模板，在记账时可保存当前记录为模板</p>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded bg-gray-50">
                <div>
                  <span className="font-medium">{t.name}</span>
                  {t.amount && <span className="ml-2 text-muted-foreground">¥{t.amount}</span>}
                </div>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={async () => {
                  await fetch(`/api/templates?id=${t.id}`, { method: "DELETE" });
                  toast("模板已删除");
                  setTemplates(templates.filter((x) => x.id !== t.id));
                }}>删除</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add templates and recurring rules"
```

---

### Task 14: 数据导入

**Files:**
- Create: `src/app/api/import/route.ts`
- Modify: `src/app/(dashboard)/settings/import/page.tsx`

- [ ] **Step 1: Import API**

```typescript
// src/app/api/import/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { ledgerId, transactions } = body;

  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const t of transactions) {
    try {
      await prisma.transaction.create({
        data: {
          ledgerId,
          type: t.type || "expense",
          amount: parseFloat(t.amount),
          date: new Date(t.date),
          note: t.note || "",
          categoryId: t.categoryId || null,
          accountId: t.accountId || null,
          merchant: t.merchant || null,
        },
      });
      results.success++;
    } catch (e: any) {
      results.failed++;
      results.errors.push(e.message);
    }
  }

  return NextResponse.json(results);
}
```

- [ ] **Step 2: 导入页面**

```tsx
// src/app/(dashboard)/settings/import/page.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [mapping, setMapping] = useState({ date: 0, amount: 1, note: 2, type: 3 });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",");
      const rows = lines.slice(1, 6).map((l) => l.split(","));
      setPreview(rows);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    const rows = lines.slice(1).map((l) => {
      const cols = l.split(",");
      return {
        date: cols[mapping.date]?.trim(),
        amount: cols[mapping.amount]?.trim(),
        note: cols[mapping.note]?.trim(),
        type: cols[mapping.type]?.trim(),
      };
    });

    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions: rows }),
    });

    const result = await res.json();
    toast(`导入完成: ${result.success} 条成功, ${result.failed} 条失败`);
  };

  return (
    <Card>
      <CardHeader><CardTitle>数据导入</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <input type="file" accept=".csv,.xlsx" ref={fileRef} onChange={handleFile} />
        {preview.length > 0 && (
          <>
            <div className="text-sm font-medium">预览（前5行）</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {row.map((col: string, j: number) => (
                        <td key={j} className="border p-1">{col}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={handleImport}>开始导入</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add data import"
```

---

### Task 15: 自动分类规则

**Files:**
- Modify: `src/app/api/rules/route.ts`
- Modify: `src/app/(dashboard)/settings/rules/page.tsx`

- [ ] **Step 1: Rules API**

```typescript
// src/app/api/rules/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const ledgerId = searchParams.get("ledgerId") || (await getDefaultLedger(session.user.id));
  const rules = await prisma.rule.findMany({
    where: { ledgerId },
    orderBy: { priority: "asc" },
  });
  return NextResponse.json(rules.map((r) => ({ ...r, conditions: JSON.parse(r.conditions) })));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const rule = await prisma.rule.create({
    data: { ...body, conditions: JSON.stringify(body.conditions) },
  });
  return NextResponse.json(rule, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.rule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

async function getDefaultLedger(userId: string) {
  const member = await prisma.ledgerMember.findFirst({ where: { userId }, orderBy: { joinedAt: "asc" } });
  return member?.ledgerId;
}
```

- [ ] **Step 2: 规则页面**

```tsx
// src/app/(dashboard)/settings/rules/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", matchMode: "all", conditions: [{ field: "merchant", operator: "contains", value: "" }],
    actionCategoryId: "",
  });

  useEffect(() => {
    fetch("/api/rules").then((r) => r.json()).then(setRules);
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const handleSave = async () => {
    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("规则已创建");
      setOpen(false);
      const r = await fetch("/api/rules").then((r) => r.json());
      setRules(r);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>自动分类规则</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>新增规则</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新增规则</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="规则名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Select value={form.matchMode} onValueChange={(v) => setForm({ ...form, matchMode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">满足所有条件</SelectItem>
                  <SelectItem value="any">满足任一条件</SelectItem>
                </SelectContent>
              </Select>
              {form.conditions.map((c, idx) => (
                <div key={idx} className="flex gap-2">
                  <Select value={c.field} onValueChange={(v) => {
                    const conditions = [...form.conditions];
                    conditions[idx].field = v;
                    setForm({ ...form, conditions });
                  }}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merchant">商家</SelectItem>
                      <SelectItem value="note">备注</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="关键词"
                    value={c.value}
                    onChange={(e) => {
                      const conditions = [...form.conditions];
                      conditions[idx].value = e.target.value;
                      setForm({ ...form, conditions });
                    }}
                  />
                </div>
              ))}
              <Select value={form.actionCategoryId} onValueChange={(v) => setForm({ ...form, actionCategoryId: v })}>
                <SelectTrigger><SelectValue placeholder="自动分类" /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.type === "expense").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSave} className="w-full">保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <p className="text-muted-foreground">暂无规则。设置后，记账时会根据商家名/备注自动匹配分类</p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 rounded bg-gray-50">
                <div>
                  <span className="font-medium">{rule.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">优先级: {rule.priority}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={async () => {
                  await fetch(`/api/rules?id=${rule.id}`, { method: "DELETE" });
                  toast("规则已删除");
                  setRules(rules.filter((r) => r.id !== rule.id));
                }}>删除</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: 在 TransactionForm 中添加自动分类逻辑**

在 TransactionForm 的 handleSubmit 中，保存前先获取匹配的规则。在 transactions API route 的 POST 中应用规则：

```typescript
// 在 src/app/api/transactions/route.ts 的 POST 函数开头添加：
// 自动分类规则匹配
const rules = await prisma.rule.findMany({
  where: { ledgerId: body.ledgerId },
  orderBy: { priority: "asc" },
});

for (const rule of rules) {
  const conditions = JSON.parse(rule.conditions);
  const matches = conditions.every((c: any) => {
    const fieldValue = body[c.field] || "";
    return fieldValue.includes(c.value);
  });

  if (matches) {
    if (rule.actionCategoryId) body.categoryId = rule.actionCategoryId;
    if (rule.actionAccountId) body.accountId = rule.actionAccountId;
    break;
  }
}
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: add auto-categorization rules"
```

---

### Task 16: Docker 部署

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

- [ ] **Step 1: 创建 Dockerfile**

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 依赖安装阶段
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 运行阶段
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/ledger.db

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **Step 2: 创建 docker-compose.yml**

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./prisma:/app/prisma
    environment:
      - DATABASE_URL=file:/app/data/ledger.db
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-change-me-in-production}
      - NEXTAUTH_URL=http://localhost:3000
    restart: unless-stopped
```

- [ ] **Step 3: 创建 .dockerignore**

```
node_modules
.git
.gitignore
.next
data
*.md
```

- [ ] **Step 4: 配置 Next.js 输出 standalone**

```typescript
// next.config.ts — 添加 output: "standalone"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
```

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat: add Docker deployment"
```

---

### Task 17: 初始化数据库与默认数据

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Seed 脚本**

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 创建演示用户
  const passwordHash = await bcrypt.hash("123456", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@flowledger.com" },
    update: {},
    create: {
      name: "演示用户",
      email: "demo@flowledger.com",
      passwordHash,
    },
  });

  // 创建账本
  const ledger = await prisma.ledger.upsert({
    where: { id: "demo-ledger" },
    update: {},
    create: {
      id: "demo-ledger",
      name: "我的账本",
      type: "family",
      ownerId: user.id,
    },
  });

  await prisma.ledgerMember.upsert({
    where: { userId_ledgerId: { userId: user.id, ledgerId: ledger.id } },
    update: {},
    create: { userId: user.id, ledgerId: ledger.id, role: "owner" },
  });

  // 默认分类
  const expenseCategories = ["餐饮", "交通", "购物", "住房", "娱乐", "医疗", "教育", "其他"];
  const incomeCategories = ["工资", "兼职", "投资", "红包", "其他"];

  for (const name of expenseCategories) {
    await prisma.category.create({ data: { name, type: "expense", ledgerId: ledger.id } });
  }
  for (const name of incomeCategories) {
    await prisma.category.create({ data: { name, type: "income", ledgerId: ledger.id } });
  }

  // 默认账户
  const accounts = [
    { name: "现金", type: "cash", balance: 5000 },
    { name: "银行卡", type: "bank", balance: 50000 },
    { name: "支付宝", type: "alipay", balance: 10000 },
    { name: "微信", type: "wechat", balance: 3000 },
  ];

  for (const acc of accounts) {
    await prisma.account.create({
      data: { ...acc, initialBalance: acc.balance, ledgerId: ledger.id },
    });
  }

  console.log("Seed completed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: 在 package.json 中添加 seed 命令**

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

```bash
npm install -D tsx
```

- [ ] **Step 3: 运行 seed**

```bash
npx prisma db seed
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: add database seed script"
```

---

### Task 18: 余额完整修复与最终验证

- [ ] **Step 1: 确保仪表盘显示完整的年度数据**

修改 `src/app/api/analytics/overview/route.ts`，添加年度收支聚合。

- [ ] **Step 2: 构建并验证**

```bash
npm run build
```

修复任何 TypeScript / 构建错误。

- [ ] **Step 3: 最终提交**

```bash
git add -A && git commit -m "fix: resolve remaining issues and finalize"
```
