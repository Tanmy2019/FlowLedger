# FlowLedger 记账软件设计文档

## 概述

FlowLedger 是一款支持多用户、多账本的个人/家庭记账 Web 应用。用户可自行管理流水数据，统计与分析支持多人共享查看。后端使用 SQLite 本地存储，通过 Docker 一键部署。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 数据库 ORM | Prisma |
| 数据库 | SQLite (via better-sqlite3) |
| 认证 | NextAuth v5 (Credentials + JWT) |
| 图表 | Recharts |
| 部署 | Docker + Docker Compose |

## 架构

### 部署架构

```
Docker Container
├── Next.js App
│   ├── React 前端
│   └── API Routes (后端)
└── SQLite (data/ledger.db)
```

单体架构，单个 Docker 容器部署。SQLite 数据文件通过 volume 持久化。

### 项目结构

```
flowledger/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx              # 仪表盘
│   │   │   ├── transactions/
│   │   │   ├── accounts/
│   │   │   ├── categories/
│   │   │   ├── budgets/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   └── api/                      # API Routes
│   ├── components/
│   │   ├── ui/
│   │   ├── charts/
│   │   └── forms/
│   ├── lib/
│   │   ├── db.ts                     # Prisma 客户端
│   │   ├── auth.ts                   # NextAuth 配置
│   │   └── utils.ts
│   └── types/
├── public/
├── Dockerfile
└── docker-compose.yml
```

## 数据库设计

### 核心模型

#### User
- `id` (String, UUID)
- `name` (String)
- `email` (String, unique)
- `passwordHash` (String)
- `createdAt` (DateTime)

#### Ledger (账本)
- `id` (String, UUID)
- `name` (String)
- `type` (Enum: family/travel/business)
- `icon` (String)
- `color` (String)
- `ownerId` (String, FK → User)
- `createdAt` (DateTime)

#### LedgerMember (账本成员)
- `id` (String, UUID)
- `userId` (String, FK → User)
- `ledgerId` (String, FK → Ledger)
- `role` (Enum: owner/editor/viewer)
- `joinedAt` (DateTime)

#### Transaction (流水)
- `id` (String, UUID)
- `ledgerId` (String, FK → Ledger)
- `type` (Enum: expense/income/transfer)
- `amount` (Decimal)
- `date` (DateTime)
- `note` (String?)
- `categoryId` (String?, FK → Category)
- `accountId` (String?, FK → Account)
- `toAccountId` (String?, FK → Account, 转账目标)
- `memberId` (String?, FK → LedgerMember)
- `merchant` (String?)
- `project` (String?)
- `status` (Enum: confirmed/pending, 周期记账用)
- `templateId` (String?, FK → Template)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

#### Category (分类)
- `id` (String, UUID)
- `ledgerId` (String, FK → Ledger)
- `name` (String)
- `parentId` (String?, self FK → Category, 二级分类)
- `type` (Enum: expense/income)
- `icon` (String?)
- `color` (String?)
- `sortOrder` (Int)

#### Account (账户)
- `id` (String, UUID)
- `ledgerId` (String, FK → Ledger)
- `name` (String)
- `type` (Enum: cash/bank/credit/alipay/wechat/investment/liability)
- `balance` (Decimal)
- `initialBalance` (Decimal)
- `icon` (String?)
- `color` (String?)
- `sortOrder` (Int)

#### Budget (预算)
- `id` (String, UUID)
- `ledgerId` (String, FK → Ledger)
- `name` (String)
- `amount` (Decimal)
- `period` (Enum: monthly/yearly/custom)
- `startDate` (DateTime)
- `endDate` (DateTime?)
- `categoryId` (String?, FK → Category, null=总预算)
- `type` (Enum: necessary/discretionary/all)

#### Tag (标签)
- `id` (String, UUID)
- `ledgerId` (String, FK → Ledger)
- `name` (String)
- `color` (String?)

#### TransactionTag (多对多)
- `transactionId` (String, FK → Transaction)
- `tagId` (String, FK → Tag)

#### Template (记账模板)
- `id` (String, UUID)
- `ledgerId` (String, FK → Ledger)
- `name` (String)
- `type` (Enum: expense/income/transfer)
- `amount` (Decimal?)
- `categoryId` (String?)
- `accountId` (String?)
- `note` (String?)

#### RecurringRule (周期记账规则)
- `id` (String, UUID)
- `ledgerId` (String, FK → Ledger)
- `name` (String)
- `type` (Enum: expense/income/transfer)
- `amount` (Decimal)
- `categoryId` (String?)
- `accountId` (String?)
- `note` (String?)
- `cronExpression` (String, 如 "0 0 1 * *")
- `nextRunDate` (DateTime)
- `isActive` (Boolean)

#### Rule (自动分类规则)
- `id` (String, UUID)
- `ledgerId` (String, FK → Ledger)
- `name` (String)
- `conditions` (JSON, [{field: merchant/note, operator: contains, value: "星巴克"}])
- `matchMode` (Enum: all/any)
- `actionCategoryId` (String?, FK → Category)
- `actionTagIds` (String[]?, FK → Tag)
- `actionAccountId` (String?, FK → Account)
- `priority` (Int)

### 权限模型

- **owner**: 完全控制，管理成员、删除账本
- **editor**: 可增删改流水，不可管理成员
- **viewer**: 只读，可查看统计和流水

### 转账逻辑

使用 Prisma 事务：
```
transaction.$transaction([
  account1.update({ where: { id: fromId }, data: { balance: { decrement: amount } } }),
  account2.update({ where: { id: toId }, data: { balance: { increment: amount } } }),
  transaction.create({ ... }),
])
```

## 页面设计

### 导航结构

左侧侧边栏：
- 顶部：账本切换下拉框
- 菜单：仪表盘 / 流水 / 账户 / 分类 / 预算 / 统计 / 设置
- 右下角：浮动「记一笔」按钮

### 仪表盘 (/dashboard)

2行5列卡片布局：

| 总资产 (占2行) | 本月收入 | 本月支出 | 本月结余 | 环比变化 (占2行) |
| | 本年收入 | 本年支出 | 本年结余 | |

下方：支出分类饼图 + 近6月收支趋势折线图（并排）

### 流水管理 (/transactions)

- 时间分组列表显示
- 顶部筛选栏：时间范围 / 类型 / 分类 / 账户 / 搜索框
- 点击编辑，勾选批量操作
- 右上角「记一笔」按钮

### 统计页面 (/analytics)

- 支出分类饼图/排行榜
- 收入来源饼图/排行榜
- 每日/每周/每月收支趋势折线图
- 周/月对比柱状图
- 日历热力图
- 账户余额分布
- 净现金流趋势
- 必要 vs 非必要支出对比
- 财务健康评分
- 标签/成员/商家聚合统计
- 累计结余走势图
- 资金流动桑基图

### 预算页面 (/budgets)

- 预算卡片列表（分类预算 + 总预算）
- 进度条显示使用率，80%/100% 变色预警
- 剩余天数可花额度
- 与上月/去年对比

### 设置页面 (/settings)

- 账本管理 / 成员管理 / 分类管理
- 模板管理 / 自动分类规则 / 数据导入
- 主题切换 / 个人资料

### 快速记账弹窗

悬浮弹出，包含：类型、金额、分类、日期、账户、备注、标签、成员（可选）、存为模板选项。

## 认证方案

- NextAuth v5 Credentials Provider
- 邮箱 + 密码登录
- JWT Session（无数据库 session 存储）
- API 中间件校验 JWT + 账本权限
- 邀请链接流程（含 token，可设置过期）

## 核心特性

### 周期记账
- RecurringRule 表存储规则
- cron 定时任务（或 API 触发）检查到期规则
- 生成 status=pending 待确认记录
- 用户确认后转为正式记录

### 模板记账
- 从已有记录「存为模板」
- 选择模板一键填充，可修改后提交

### 数据导入
- 上传 CSV/Excel → 列映射配置 → 预览 → 确认导入
- 支持保存映射配置为模板

### 自动分类规则
- 条件组合（AND/OR），匹配商家名/备注关键词
- 自动填充分类/标签/账户
- 记账时匹配 + 导入时批量归类

### 批量操作
- 流水列表勾选：批量删除、批量编辑
- 分类/成员列表：批量删除

## 部署

Docker Compose：
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data  # SQLite 持久化
    environment:
      - DATABASE_URL=file:/app/data/ledger.db
      - NEXTAUTH_SECRET=...
```

## 设计与技术决策

1. **Next.js 单体 vs 前后端分离**：选择单体，开发效率高、部署简单、迁移路径平滑
2. **SQLite vs PostgreSQL**：选择 SQLite，零运维、适合中小团队、Docker volume 持久化
3. **Prisma vs Drizzle**：选择 Prisma，ORM 成熟、迁移工具完善、类型生成好
4. **NextAuth v5 vs 自建认证**：选择 NextAuth，开箱即用、支持 JWT、可扩展 OAuth
5. **Recharts vs ECharts**：选择 Recharts，React 原生、Tree-shakable、SSR 友好
