# FlowLedger 功能增强设计

## 概述

为 FlowLedger 新增四项功能：流水批量删除、流水筛选增强、分类子分类支持、账本删除。

## 1. 流水批量删除

### API 层

新增 `src/app/api/transactions/batch-delete/route.ts`：

- 方法：`POST`
- 请求体：`{ ids: string[] }`
- 处理逻辑（在 Prisma `$transaction` 中）：
  1. 查询所有待删除交易及其关联账户
  2. 回滚各账户余额（与单条删除逻辑一致）
  3. 批量删除交易（级联删除 TransactionTag）
- 返回：`{ count: number }`

### 前端

修改 `src/app/dashboard/transactions/page.tsx`：

- 将 `handleBatchDelete` 中逐个调用 `DELETE /api/transactions/[id]` 的逻辑改为单次 `POST /api/transactions/batch-delete`
- 交互不变：选中交易 → 点击删除 → 确认 → 批量删除 → 刷新列表

## 2. 流水筛选增强

### 新增筛选条件

在交易列表页现有筛选栏（类型选择器、搜索框、日期范围）基础上，新增：

1. **分类筛选下拉**：选择分类后附带 `categoryId` 参数
   - 与类型选择联动：选"支出"时只显示支出分类，选"收入"时只显示收入分类，"全部"时显示所有
2. **账户筛选下拉**：选择账户后附带 `accountId` 参数
   - 不依赖类型，始终显示全部账户

### UI 布局

```
[类型: 全部 ▼] [分类: 全部 ▼] [账户: 全部 ▼] [搜索...] [日期范围]
```

### API 层

无需改动，`GET /api/transactions` 已支持 `categoryId` 和 `accountId` 查询参数。

## 3. 分类管理增加子分类

### 修改分类对话框

编辑 `src/app/dashboard/categories/page.tsx`，在创建/编辑对话框新增**父分类选择器**：

- 下拉选项：
  - "无（顶级分类）" — 默认值
  - 所有同类型的分类（排除自身和自身子分类，避免循环引用）
- 选择父分类后，类型字段自动锁定为父分类类型
- 子分类深度限制：一级（父 → 子）

### 列表展示

无须改动，已有缩进样式和虚线边框支持子分类展示。

### 删除行为

删除父分类时级联删除所有子分类（数据库已配置 `onDelete: Cascade`）。

## 4. 账本管理增加删除功能

### API 层

修改 `src/app/api/ledgers/route.ts`，新增 `DELETE` 方法：

- 查询参数：`ledgerId`
- 验证：当前用户是该账本成员
- 处理：删除 Ledger（外键 Cascade 配置自动清除 Transaction、Category、Account、Budget、Tag 等关联数据）
- 返回：成功状态

### 前端

修改 `src/app/dashboard/settings/page.tsx`：

- 账本卡片添加**删除按钮**（红色，Trash2 图标）
- 确认对话框文案：
  > "确定删除账本「{name}」？此操作将清除该账本下的所有交易记录、分类、账户、预算等数据，且不可恢复。"
- 删除成功后跳转到其他账本（通过 localStorage 切换 activeLedgerId，刷新页面跳转至仪表盘）

## 影响范围

| 功能 | 新增/修改文件 |
|---|---|
| 批量删除 | `src/app/api/transactions/batch-delete/route.ts`（新增）<br>`src/app/dashboard/transactions/page.tsx`（修改） |
| 筛选增强 | `src/app/dashboard/transactions/page.tsx`（修改） |
| 子分类 | `src/app/dashboard/categories/page.tsx`（修改） |
| 账本删除 | `src/app/api/ledgers/route.ts`（修改）<br>`src/app/dashboard/settings/page.tsx`（修改） |

## 数据库影响

无 Schema 变更。所有功能均利用现有数据库结构和外键约束。
