# FlowLedger 功能增强实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 FlowLedger 新增流水批量删除、流水筛选增强、分类子分类支持、账本删除四个功能

**Architecture:** Next.js App Router 项目，API 层基于 Prisma + SQLite，前端使用 Shadcn UI + Tailwind CSS v4。所有功能均在现有数据库结构上实现，无需 Schema 变更。

**Tech Stack:** Next.js 15 (App Router), Prisma v7 + SQLite, Shadcn UI, Tailwind CSS v4, date-fns

---

## 文件映射

| 文件 | 操作 | 职责 |
|---|---|---|
| `src/app/api/transactions/batch-delete/route.ts` | 新增 | 批量删除交易的 API 端点 |
| `src/app/dashboard/transactions/page.tsx` | 修改 | 添加分类/账户筛选下拉；批量删除改为调用新端点 |
| `src/app/dashboard/categories/page.tsx` | 修改 | 分类对话框添加父分类选择器 |
| `src/app/api/ledgers/route.ts` | 修改 | 新增 DELETE 方法 |
| `src/app/dashboard/settings/page.tsx` | 修改 | 账本列表添加删除按钮和确认对话框 |

---

### Task 1: 创建批量删除 API 端点

**Files:**
- Create: `src/app/api/transactions/batch-delete/route.ts`

- [ ] **Step 1: 创建批量删除 API 路由文件**

新建 `src/app/api/transactions/batch-delete/route.ts`：

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, getDefaultLedger } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ledgerId = await getDefaultLedger(session.user.id);
  if (!ledgerId) {
    return new NextResponse("No ledger found", { status: 400 });
  }

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array is required" }, { status: 400 });
  }

  // 查询所有待删除交易（仅限当前账本）
  const transactions = await prisma.transaction.findMany({
    where: { id: { in: ids }, ledgerId },
  });

  if (transactions.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  // 在事务中：先回滚余额，再批量删除
  await prisma.$transaction(async (tx) => {
    for (const oldTx of transactions) {
      // REVERT balance changes（与单个 DELETE 逻辑一致）
      if (oldTx.type === "expense" && oldTx.accountId) {
        await tx.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { increment: oldTx.amount } },
        });
      } else if (oldTx.type === "income" && oldTx.accountId) {
        await tx.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { decrement: oldTx.amount } },
        });
      } else if (oldTx.type === "transfer") {
        if (oldTx.accountId) {
          await tx.account.update({
            where: { id: oldTx.accountId },
            data: { balance: { increment: oldTx.amount } },
          });
        }
        if (oldTx.toAccountId && oldTx.toAccountId !== oldTx.accountId) {
          await tx.account.update({
            where: { id: oldTx.toAccountId },
            data: { balance: { decrement: oldTx.amount } },
          });
        }
      }
    }

    await tx.transaction.deleteMany({
      where: { id: { in: ids }, ledgerId },
    });
  });

  return NextResponse.json({ count: transactions.length });
}
```

- [ ] **Step 2: 验证编译通过**

```bash
npx tsc --noEmit
```

确认无类型错误。

- [ ] **Step 3: 提交**

```bash
git add src/app/api/transactions/batch-delete/route.ts
git commit -m "feat: add batch delete API endpoint for transactions"
```

---

### Task 2: 更新前端批量删除逻辑

**Files:**
- Modify: `src/app/dashboard/transactions/page.tsx`（handleBatchDelete 函数）

- [ ] **Step 1: 替换 handleBatchDelete 实现**

将 `src/app/dashboard/transactions/page.tsx:195-225` 的 `handleBatchDelete` 函数替换为：

```typescript
const handleBatchDelete = async () => {
  if (selectedIds.size === 0) return;
  if (!confirm(`确定要删除选中的 ${selectedIds.size} 条流水吗？`)) return;

  setDeleting(true);
  try {
    const res = await fetch("/api/transactions/batch-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });

    if (!res.ok) throw new Error("Failed to delete");

    const result = await res.json();
    toast(`成功删除 ${result.count} 条流水`);
    setSelectedIds(new Set());
    loadTransactions();
  } catch {
    toast("批量删除失败");
  } finally {
    setDeleting(false);
  }
};
```

- [ ] **Step 2: 提交**

```bash
git add src/app/dashboard/transactions/page.tsx
git commit -m "feat: update frontend to use batch delete API"
```

---

### Task 3: 添加分类和账户筛选下拉

**Files:**
- Modify: `src/app/dashboard/transactions/page.tsx`

- [ ] **Step 1: 添加分类和账户的类型定义和状态**

在 `src/app/dashboard/transactions/page.tsx` 的 state 声明区域（约第 107 行），在 `endDate` 状态后添加：

```typescript
const [categoryFilter, setCategoryFilter] = useState("all");
const [accountFilter, setAccountFilter] = useState("all");

// 筛选选项数据
type FilterCategory = { id: string; name: string; type: string };
type FilterAccount = { id: string; name: string };

const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
const [filterAccounts, setFilterAccounts] = useState<FilterAccount[]>([]);
```

- [ ] **Step 2: 加载分类和账户数据**

在 `loadTransactions` 函数定义之后，添加数据加载 effect：

```typescript
// 加载筛选选项
useEffect(() => {
  const loadFilterData = async () => {
    try {
      const [catRes, accRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/accounts"),
      ]);
      if (catRes.ok) {
        type NestedCategory = { id: string; name: string; type: string; children?: NestedCategory[] };
        const cats: NestedCategory[] = await catRes.json();
        // 平铺所有分类（包括子分类）用于筛选
        const flat: FilterCategory[] = [];
        const flatten = (items: NestedCategory[]) => {
          for (const c of items) {
            flat.push({ id: c.id, name: c.name, type: c.type });
            if (c.children) flatten(c.children);
          }
        };
        flatten(cats);
        setFilterCategories(flat);
      }
      if (accRes.ok) {
        const accs = await accRes.json();
        setFilterAccounts(accs.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })));
      }
    } catch {
      // 静默失败，筛选下拉为空
    }
  };
  loadFilterData();
}, []);
```

- [ ] **Step 3: 更新 loadTransactions 传递筛选参数**

在 `loadTransactions` 的 `useCallback` 中，在 `if (endDate)` 行之后添加：

```typescript
if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
if (accountFilter !== "all") params.set("accountId", accountFilter);
```

同时更新依赖数组：`[typeFilter, search, startDate, endDate, categoryFilter, accountFilter, page]`

- [ ] **Step 4: 在筛选栏中添加分类和账户下拉**

在 `src/app/dashboard/transactions/page.tsx` 的 Filter Bar 区域（约第 252-298 行），在类型选择器 `</SelectContent></Select>` 之后、搜索框 `<div className="relative flex-1">` 之前插入：

```tsx
<Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value ?? "all"); setPage(1); }}>
  <SelectTrigger className="w-36">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">全部分类</SelectItem>
    {filterCategories
      .filter((c) => typeFilter === "all" || c.type === typeFilter)
      .map((c) => (
        <SelectItem key={c.id} value={c.id}>
          {c.name}
        </SelectItem>
      ))}
  </SelectContent>
</Select>

<Select value={accountFilter} onValueChange={(value) => { setAccountFilter(value ?? "all"); setPage(1); }}>
  <SelectTrigger className="w-36">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">全部账户</SelectItem>
    {filterAccounts.map((a) => (
      <SelectItem key={a.id} value={a.id}>
        {a.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

- [ ] **Step 5: 验证编译通过**

```bash
npx tsc --noEmit
```

确认无类型错误。

- [ ] **Step 6: 提交**

```bash
git add src/app/dashboard/transactions/page.tsx
git commit -m "feat: add category and account filters to transactions page"
```

---

### Task 4: 分类对话框添加父分类选择器

**Files:**
- Modify: `src/app/dashboard/categories/page.tsx`

- [ ] **Step 1: 在分类对话框的类型选择器后添加父分类选择器**

在 `src/app/dashboard/categories/page.tsx` 的类型选择器 `</SelectContent></Select>` 之后（约第 359 行）、颜色字段之前插入：

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">父分类（可选）</label>
  <Select
    value={form.parentId}
    onValueChange={(value) => {
      const val = value ?? "";
      setForm({ ...form, parentId: val });
    }}
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="无（顶级分类）" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">无（顶级分类）</SelectItem>
      {categories
        .filter((c) => c.type === form.type && c.id !== editing?.id)
        .map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
    </SelectContent>
  </Select>
</div>
```

- [ ] **Step 2: 验证编译通过**

```bash
npx tsc --noEmit
```

确认无类型错误。

- [ ] **Step 3: 提交**

```bash
git add src/app/dashboard/categories/page.tsx
git commit -m "feat: add parent category selector in category dialog"
```

---

### Task 5: 添加账本删除 API 端点

**Files:**
- Modify: `src/app/api/ledgers/route.ts`

- [ ] **Step 1: 在 ledgers 路由中添加 DELETE 方法**

在 `src/app/api/ledgers/route.ts` 文件末尾（`POST` 函数之后）添加：

```typescript
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

  // 验证当前用户是该账本成员
  const member = await prisma.ledgerMember.findFirst({
    where: { userId: session.user.id, ledgerId },
  });

  if (!member) {
    return new NextResponse("Ledger not found", { status: 404 });
  }

  // 删除账本（外键 Cascade 配置会自动清理关联数据）
  await prisma.ledger.delete({ where: { id: ledgerId } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: 验证编译通过**

```bash
npx tsc --noEmit
```

确认无类型错误。

- [ ] **Step 3: 提交**

```bash
git add src/app/api/ledgers/route.ts
git commit -m "feat: add delete ledger API endpoint"
```

---

### Task 6: 前端添加账本删除按钮和确认对话框

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

- [ ] **Step 1: 导入 Trash2 图标**

在文件顶部的 lucide-react 导入中添加 `Trash2`：

```typescript
import { Plus, Book, Users, Trash2 } from "lucide-react";
```

- [ ] **Step 2: 添加 handleDeleteLedger 函数**

在 `handleCreateLedger` 函数之后添加：

```typescript
const handleDeleteLedger = async (ledger: LedgerItem) => {
  if (!confirm(`确定删除账本「${ledger.name}」？此操作将清除该账本下的所有交易记录、分类、账户、预算等数据，且不可恢复。`)) {
    return;
  }

  try {
    const res = await fetch(`/api/ledgers?ledgerId=${ledger.id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete");

    toast("账本已删除");
    loadData();
    // 跳转到其他账本（如果有）
    const remaining = ledgers.filter((l) => l.id !== ledger.id);
    if (remaining.length > 0) {
      localStorage.setItem("activeLedgerId", remaining[0].id);
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/dashboard";
    }
  } catch {
    toast("删除失败");
  }
};
```

- [ ] **Step 3: 在账本卡片中添加删除按钮**

在 `src/app/dashboard/settings/page.tsx` 的账本列表项中，在类型标签 `</p>` 之后、`</div>` 闭合之前添加删除按钮：

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleDeleteLedger(ledger)}
>
  <Trash2 className="size-4 text-red-500" />
</Button>
```

具体位置在约第 188 行（`<p className="text-xs text-muted-foreground">` 的闭合 `</div>` 之后），需要在右侧操作区域添加按钮。需要将现有的账本卡片从：

```tsx
<div
  key={ledger.id}
  className="flex items-center justify-between rounded-lg border p-3"
>
  <div>
    <p className="text-sm font-medium">{ledger.name}</p>
    <p className="text-xs text-muted-foreground">
      {typeLabels[ledger.type] || ledger.type}
    </p>
  </div>
</div>
```

改为：

```tsx
<div
  key={ledger.id}
  className="flex items-center justify-between rounded-lg border p-3"
>
  <div>
    <p className="text-sm font-medium">{ledger.name}</p>
    <p className="text-xs text-muted-foreground">
      {typeLabels[ledger.type] || ledger.type}
    </p>
  </div>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => handleDeleteLedger(ledger)}
  >
    <Trash2 className="size-4 text-red-500" />
  </Button>
</div>
```

- [ ] **Step 4: 验证编译通过**

```bash
npx tsc --noEmit
```

确认无类型错误。

- [ ] **Step 5: 提交**

```bash
git add src/app/dashboard/settings/page.tsx
git commit -m "feat: add delete ledger button with confirmation in settings"
```

---

## 验证清单

完成后验证以下场景：

- [ ] 批量删除：选择多条流水 → 点击删除 → 确认 → 成功删除并刷新列表 → 对应账户余额正确回滚
- [ ] 筛选功能：分类下拉随类型选择联动（选"支出"时只显示支出分类）
- [ ] 筛选功能：选择分类/账户后，列表正确过滤
- [ ] 子分类：创建分类时可选父分类，列表中以缩进显示
- [ ] 子分类：编辑分类时可修改父分类归属
- [ ] 账本删除：点击删除 → 确认对话框 → 删除后跳转到其他账本
