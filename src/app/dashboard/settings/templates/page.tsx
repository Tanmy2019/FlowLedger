"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, FileText } from "lucide-react";

type Category = {
  id: string;
  name: string;
  type: string;
  color: string | null;
};

type Account = {
  id: string;
  name: string;
  type: string;
};

type TemplateItem = {
  id: string;
  name: string;
  type: string;
  amount: number | null;
  note: string | null;
  categoryId: string | null;
  accountId: string | null;
  category: Category | null;
  account: Account | null;
};

export default function TemplatesSettingsPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTemplates(data);
    } catch {
      toast("加载模板失败");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch {
      // silent
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) setAccounts(await res.json());
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadTemplates();
    loadCategories();
    loadAccounts();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast("请输入模板名称");
      return;
    }

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          amount: amount ? parseFloat(amount) : null,
          categoryId: categoryId || null,
          accountId: accountId || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast("模板已创建");
      setName("");
      setType("expense");
      setAmount("");
      setCategoryId("");
      setAccountId("");
      loadTemplates();
    } catch {
      toast("创建失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此模板吗？")) return;

    try {
      const res = await fetch("/api/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast("模板已删除");
      loadTemplates();
    } catch {
      toast("删除失败");
    }
  };

  const typeLabels: Record<string, string> = {
    expense: "支出",
    income: "收入",
    transfer: "转账",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">记账模板</h1>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" />
            新增模板
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">名称</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="模板名称"
                className="w-36"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">类型</label>
              <Select value={type} onValueChange={(v) => setType(v ?? "expense")}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">支出</SelectItem>
                  <SelectItem value="income">收入</SelectItem>
                  <SelectItem value="transfer">转账</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">金额</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="可选"
                className="w-28"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">分类</label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="不限" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">不限</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">账户</label>
              <Select value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="不限" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">不限</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="size-4" />
              创建
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          已有模板 ({templates.length})
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="mb-2 size-8" />
            <p className="text-sm">暂无模板</p>
            <p className="mt-1 text-xs">创建模板以便快速记账</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{template.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={
                          template.type === "expense"
                            ? "text-red-500"
                            : template.type === "income"
                              ? "text-green-500"
                              : "text-blue-500"
                        }
                      >
                        {typeLabels[template.type] || template.type}
                      </span>
                      {template.amount != null && (
                        <>
                          <span>·</span>
                          <span>
                            ¥{template.amount.toLocaleString("zh-CN")}
                          </span>
                        </>
                      )}
                      {template.category && (
                        <>
                          <span>·</span>
                          <span>{template.category.name}</span>
                        </>
                      )}
                      {template.account && (
                        <>
                          <span>·</span>
                          <span>{template.account.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="size-3.5 text-red-500" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
