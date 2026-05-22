"use client";

import { useState, useEffect } from "react";
import { ledgerFetchUrl } from "@/lib/ledger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
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

type MonthlyDataItem = {
  month: string;
  income: number;
  expense: number;
};

type DailyExpenseItem = {
  date: string;
  amount: number;
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
  incomeCategoryData: CategoryItem[];
  trendData: TrendItem[];
};

type TrendsData = {
  monthlyData: MonthlyDataItem[];
  dailyExpense: DailyExpenseItem[];
};

const formatCurrency = (value: number) => {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `¥${value < 0 ? "-" : ""}${formatted}`;
};

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(ledgerFetchUrl("/api/analytics/overview")).then((r) => r.json()),
      fetch(ledgerFetchUrl("/api/analytics/trends")).then((r) => r.json()),
    ])
      .then(([overviewData, trendsData]) => {
        setOverview(overviewData);
        setTrends(trendsData);
      })
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

  if (!overview || !trends) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">统计分析</h1>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="trend">趋势</TabsTrigger>
          <TabsTrigger value="category">分类</TabsTrigger>
        </TabsList>

        {/* Tab: 概览 */}
        <TabsContent value="overview">
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Expense Category Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>支出分类（本月）</CardTitle>
              </CardHeader>
              <CardContent>
                {overview.categoryData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    暂无支出数据
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={overview.categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {overview.categoryData.map((entry, index) => (
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
                {overview.trendData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    暂无趋势数据
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={overview.trendData}>
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
        </TabsContent>

        {/* Tab: 趋势 */}
        <TabsContent value="trend">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>月度收支对比（近12个月）</CardTitle>
            </CardHeader>
            <CardContent>
              {trends.monthlyData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  暂无月度数据
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={trends.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#10B981" name="收入" />
                    <Bar dataKey="expense" fill="#EF4444" name="支出" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: 分类 */}
        <TabsContent value="category">
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle>支出分类</CardTitle>
              </CardHeader>
              <CardContent>
                {overview.categoryData.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    暂无支出数据
                  </p>
                ) : (
                  <div className="space-y-3">
                    {overview.categoryData.map((item, index) => {
                      const totalExpense = overview.monthlyExpense || 1;
                      const percentage = (item.value / totalExpense) * 100;
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div
                            className="size-3 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                item.color || COLORS[index % COLORS.length],
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">
                                {item.name}
                              </span>
                              <span className="text-sm font-semibold text-red-600">
                                {formatCurrency(item.value)}
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor:
                                    item.color ||
                                    COLORS[index % COLORS.length],
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Income Categories */}
            <Card>
              <CardHeader>
                <CardTitle>收入分类</CardTitle>
              </CardHeader>
              <CardContent>
                {!overview.incomeCategoryData ||
                overview.incomeCategoryData.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    暂无收入数据
                  </p>
                ) : (
                  <div className="space-y-3">
                    {overview.incomeCategoryData.map((item, index) => {
                      const totalIncome = overview.monthlyIncome || 1;
                      const percentage = (item.value / totalIncome) * 100;
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div
                            className="size-3 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                item.color ||
                                COLORS[(index + 5) % COLORS.length],
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">
                                {item.name}
                              </span>
                              <span className="text-sm font-semibold text-green-600">
                                {formatCurrency(item.value)}
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor:
                                    item.color ||
                                    COLORS[(index + 5) % COLORS.length],
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
