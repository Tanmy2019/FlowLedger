"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#14B8A6",
  "#6366F1",
];

type CategoryItem = {
  id: string;
  name: string;
  color: string | null;
  value: number;
};

type TrendItem = {
  month: string;
  income: number;
  expense: number;
};

type OverviewData = {
  totalAssets: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  yearlyIncome: number;
  yearlyExpense: number;
  yearlyBalance: number;
  changePercent: number;
  categoryData: CategoryItem[];
  trendData: TrendItem[];
};

const formatCurrency = (value: number) => {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `¥${value < 0 ? "-" : ""}${formatted}`;
};

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/overview")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仪表盘</h1>

      {/* Card Grid */}
      <div className="grid grid-cols-5 gap-4">
        {/* 总资产 - spans 2 rows */}
        <Card className="row-span-2 border-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md">
          <CardContent className="flex h-full flex-col justify-between p-6">
            <div>
              <p className="text-sm font-medium text-blue-200">总资产</p>
              <p className="mt-3 text-3xl font-bold tracking-tight">
                {formatCurrency(data.totalAssets)}
              </p>
            </div>
            <div className="mt-4 rounded-lg bg-white/10 px-3 py-2">
              <p className="text-xs text-blue-200">环比变化</p>
              <p
                className={`text-lg font-semibold ${
                  data.changePercent >= 0 ? "text-green-300" : "text-red-300"
                }`}
              >
                {data.changePercent >= 0 ? "+" : ""}
                {data.changePercent.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 本月收入 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本月收入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(data.monthlyIncome)}
            </p>
          </CardContent>
        </Card>

        {/* 本月支出 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本月支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(data.monthlyExpense)}
            </p>
          </CardContent>
        </Card>

        {/* 本月结余 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本月结余
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                data.monthlyBalance >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {formatCurrency(data.monthlyBalance)}
            </p>
          </CardContent>
        </Card>

        {/* 环比变化 - spans 2 rows */}
        <Card className="row-span-2 border-0 bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-md">
          <CardContent className="flex h-full flex-col justify-between p-6">
            <div>
              <p className="text-sm font-medium text-purple-200">环比变化</p>
              <p
                className={`mt-3 text-3xl font-bold tracking-tight ${
                  data.changePercent >= 0 ? "text-green-300" : "text-red-300"
                }`}
              >
                {data.changePercent >= 0 ? "+" : ""}
                {data.changePercent.toFixed(1)}%
              </p>
            </div>
            <div className="mt-4 rounded-lg bg-white/10 px-3 py-2">
              <p className="text-xs text-purple-200">相比于上月</p>
              <p className="text-sm text-purple-200">收入变化</p>
            </div>
          </CardContent>
        </Card>

        {/* 本年收入 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本年收入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(data.yearlyIncome)}
            </p>
          </CardContent>
        </Card>

        {/* 本年支出 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本年支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(data.yearlyExpense)}
            </p>
          </CardContent>
        </Card>

        {/* 本年结余 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本年结余
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                data.yearlyBalance >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {formatCurrency(data.yearlyBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Expense Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>支出分类</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                暂无支出数据
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {data.categoryData.map((entry, index) => (
                      <Cell
                        key={entry.id}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>收支趋势（近6个月）</CardTitle>
          </CardHeader>
          <CardContent>
            {data.trendData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                暂无趋势数据
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    name="收入"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#EF4444"
                    name="支出"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
