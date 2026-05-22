"use client";

import { useState, useEffect } from "react";
import { ledgerFetchUrl } from "@/lib/ledger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, Trash2, PiggyBank } from "lucide-react";

type Category = {
  id: string;
  name: string;
  color: string | null;
};

type BudgetItem = {
  id: string;
  name: string;
  amount: number;
  period: string;
  categoryId: string | null;
  category: Category | null;
  spent: number;
  remaining: number;
  usagePercent: number;
};

const formatCurrency = (value: number) => {
  return `¥${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [categoryId, setCategoryId] = useState("");

  const loadBudgets = async () => {
    try {
      const res = await fetch(ledgerFetchUrl("/api/budgets"));
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setBudgets(data);
    } catch {
      toast("加载预算失败");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(ledgerFetchUrl("/api/categories"));
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCategories(data);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !amount) {
      toast("请填写名称和金额");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast("请输入有效金额");
      return;
    }

    try {
      const res = await fetch(ledgerFetchUrl("/api/budgets"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: amountNum,
          period,
          categoryId: categoryId || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast("预算已创建");
      setName("");
      setAmount("");
      setPeriod("monthly");
      setCategoryId("");
      setOpen(false);
      loadBudgets();
    } catch {
      toast("创建失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此预算吗？")) return;

    try {
      const res = await fetch(ledgerFetchUrl("/api/budgets"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast("预算已删除");
      loadBudgets();
    } catch {
      toast("删除失败");
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-red-500";
    if (percent >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTextColor = (percent: number) => {
    if (percent >= 100) return "text-red-600";
    if (percent >= 80) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">预算管理</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-1 size-4" />
                创建预算
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建预算</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">名称</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="预算名称"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">金额</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="预算金额"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">周期</label>
                <Select value={period} onValueChange={(v) => setPeriod(v ?? "monthly")}>
                  <SelectTrigger>
                    <SelectValue>
                      {(value: string | null) =>
                        value === "monthly" ? "每月" : value === "yearly" ? "每年" : null
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">每月</SelectItem>
                    <SelectItem value="yearly">每年</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">分类（可选）</label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部类别">
                    {(value: string | null) => {
                      if (!value || value === "all") return null;
                      const cat = categories.find((c) => c.id === value);
                      return cat ? cat.name : value;
                    }}
                  </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类别</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">加载中...</p>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <PiggyBank className="mb-2 size-10" />
          <p className="text-sm">暂无预算</p>
          <p className="mt-1 text-xs">点击上方按钮创建你的第一个预算</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{budget.name}</CardTitle>
                    {budget.category && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {budget.category.name}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(budget.id)}
                  >
                    <Trash2 className="size-3.5 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">
                    {formatCurrency(budget.spent)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {formatCurrency(budget.amount)}
                  </span>
                </div>
                <Progress value={Math.min(budget.usagePercent, 100)}>
                  <ProgressTrack className="h-2">
                    <ProgressIndicator
                      className={getProgressColor(budget.usagePercent)}
                    />
                  </ProgressTrack>
                </Progress>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className={getTextColor(budget.usagePercent)}>
                    {budget.usagePercent}%
                  </span>
                  <span className="text-muted-foreground">
                    {budget.period === "monthly" ? "本月" : "本年"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
