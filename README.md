<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License: MIT" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=flat-square" alt="Status: Active" />
  <img src="https://img.shields.io/badge/docker-ready-2496ED?style=flat-square&logo=docker" alt="Docker Ready" />
</p>

<h1 align="center">📒 FlowLedger · 流账本</h1>

<p align="center">
  <strong>智能记账，掌控每一笔流水</strong><br />
  一款开源的个人/家庭财务记账工具，让每一分钱都有迹可循。
</p>

---

## 📖 简介

FlowLedger（流账本）是一款面向个人和家庭的**开源记账软件**。它不像商业软件那样把你的数据锁在云端，也不像简单的记账 App 那样只有流水记录。

我们提供 **多账本管理、预算跟踪、可视化分析、自动化规则** 等一系列专业特性，同时数据 100% 存储在你自己的设备上（SQLite），支持 Docker 自部署，隐私无忧。

> 💡 **为什么选择 FlowLedger？**
> 市面上要么是功能简陋的"小账本"，要么是数据不自由的商业软件。FlowLedger 想给你第三种选择：**功能强大，同时数据完全由你掌控。**

---

## ✨ 特性


<details open>
<summary><strong>📂 多账本管理</strong></summary>

家庭账、旅行账、生意账……多个账本独立管理，数据完全隔离，一键快速切换。生活和工作互不干扰。
</details>

<details open>
<summary><strong>💳 收支流水记账</strong></summary>

支持支出、收入、转账三种类型。金额、日期、分类是必填项，账户、备注、标签、商家、项目等随心补充。怎么记，你说了算。
</details>

<details open>
<summary><strong>🏷️ 分类与标签</strong></summary>

- **分类**：自定义一级/二级分类，搭配图标和颜色，一目了然
- **标签**：一条记录可添加多个标签（如"请客""医疗自费"），支持标签聚合统计
</details>

<details open>
<summary><strong>🏦 账户管理</strong></summary>

支持现金、银行卡、信用卡、支付宝、微信、投资账户、负债账户等多种类型。设置初始余额，自动计算账户余额，账户间转账自动增减。
</details>

<details open>
<summary><strong>🎯 预算管理</strong></summary>

按月、按年或自定义周期设定总预算，也可按分类设置独立预算。实时进度条展示使用率，80% 预警、100% 超支提醒，并帮你倒推"每天还能花多少"。
</details>

<details open>
<summary><strong>📊 统计与分析</strong></summary>

从宏观到微观，多维度看清你的财务状况：
| 图表类型 | 说明 |
|---------|------|
| 概览仪表盘 | 结余、总收支、总资产/负债、环比变化 |
| 分类统计 | 饼图/环图，支出分类排行榜 |
| 时间趋势 | 日/周/月收支折线图，同比/环比增长 |
| 日历热力图 | 每日支出强度一目了然 |
| 账户分析 | 余额分布、桑基资金流向、净现金流趋势 |
| 深度分析 | 必要/非必要支出对比、财务健康评分、标签/成员/商家统计 |
</details>

<details open>
<summary><strong>⚡ 快捷操作</strong></summary>

- **模板记账**：早中晚餐、固定房租……常用记录一键复用
- **周期记账**：每月房贷、话费自动生成待确认记录
- **批量操作**：批量编辑/删除流水、分类、成员
</details>

<details open>
<summary><strong>🤖 自动分类规则</strong></summary>

根据商家名、备注关键词自动匹配分类和标签。记多了，它自己就变聪明了。
</details>

<details open>
<summary><strong>📥 数据导入</strong></summary>

支持 CSV 导入，可解析支付宝、微信导出的账单文件，自动匹配分类，迁移成本降到最低。
</details>

<details open>
<summary><strong>🔍 搜索与筛选</strong></summary>

按金额、备注、商家、标签、分类、账户搜索，支持模糊匹配。多维度组合筛选，并可保存为快捷视图。
</details>

<details>
<summary><strong>🎨 个性化</strong></summary>

深色/浅色模式切换，自定义主题色，自定义首页卡片布局——让记账工具长成你喜欢的样子。
</details>

---

## 🛠️ 技术栈

<p align="center">
  <img src="https://skillicons.dev/icons?i=ts,nextjs,react,tailwind,prisma,sqlite,docker,vitest" alt="Tech Stack" />
</p>

| 类别 | 技术 |
|------|------|
| **语言** | TypeScript |
| **框架** | [Next.js 16](https://nextjs.org/) (App Router) |
| **前端** | React 19, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com/) (Base UI), Lucide Icons |
| **后端** | Next.js API Routes, NextAuth v5 (认证) |
| **数据库** | SQLite ([better-sqlite3](https://github.com/WiseLibs/better-sqlite3)) via Prisma ORM |
| **图表** | Recharts |
| **验证** | Zod |
| **测试** | Vitest |
| **部署** | Docker (多阶段构建) |

---

## 🚀 快速开始

### 前置要求

- Node.js 20+
- npm 或 pnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/Tanmy2019/flowledger.git
cd flowledger

# 安装依赖
npm install

# 初始化数据库
npx prisma generate
npx prisma db push
```

### 配置

创建 `.env` 文件（项目已提供示例模板）：

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"
```

> `AUTH_SECRET` 可以使用 `openssl rand -hex 32` 生成。

### 启动

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可开始使用。

### Docker 部署

```bash
docker compose up -d
```

数据持久化在 `./data` 目录，默认监听 `3000` 端口。

---

## 📖 使用指南

1. **注册 / 登录** — 创建你的账号
2. **创建账本** — 比如"家庭账""旅行账""生意账"
3. **设置基础信息** — 添加账户（银行卡、现金等）、自定义分类（餐饮、购物等）
4. **开始记账** — 记录第一笔支出或收入
5. **预算管理** — 设定月度/年度预算，监控执行情况
6. **查看分析** — 仪表盘和统计图表帮你读懂财务状况
7. **导入数据**（可选）— 上传支付宝/微信 CSV 账单，自动迁移

---

## 📁 目录结构

```
flowledger/
├── prisma/                  # 数据库 Schema 与迁移
│   └── schema.prisma
├── src/
│   ├── app/                 # Next.js App Router 页面与 API
│   │   ├── (auth)/          # 登录 / 注册
│   │   ├── api/             # REST API
│   │   └── dashboard/       # 主界面（账户、分析、预算、分类等）
│   ├── components/
│   │   ├── layout/          # 侧栏、账本切换器等布局组件
│   │   ├── transactions/    # 流水相关组件
│   │   └── ui/              # 通用 UI (shadcn/ui 组件)
│   ├── lib/                 # 工具函数、认证配置、CSV 解析、验证规则
│   ├── generated/           # Prisma 生成的客户端代码
│   └── types/               # TypeScript 类型定义
├── Dockerfile               # Docker 多阶段构建
├── docker-compose.yml       # Docker Compose 配置
├── vitest.config.ts         # 测试配置
└── 功能需求.md               # 产品需求文档
```

---

## 🤝 贡献指南

欢迎贡献代码、报告 Bug 或提出新功能建议！

目前项目尚未编写正式的贡献指南，但在提交 Issue 或 PR 前，请确保：

1. 如果是 Bug，请提供清晰的复现步骤和环境信息
2. 如果是新功能，建议先开 Issue 讨论，避免重复劳动
3. 保持代码风格与项目一致，确保测试通过

```bash
# 运行测试
npm test

# 运行测试（watch 模式）
npm run test:watch
```

---

## 📄 许可证

本项目采用 **MIT 许可证**。详情请参见 [LICENSE](LICENSE) 文件（如尚未添加，将由项目维护者后续补充）。

---

## 💬 关于

FlowLedger 是一个开源项目，由 [@Tanmy2019](https://github.com/Tanmy2019) 开发和维护。

如果你觉得这个项目有帮助，欢迎 ⭐ Star 支持！

---

<p align="center">
  Made with ❤️ and TypeScript
</p>
