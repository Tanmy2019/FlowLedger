"use client";

import { useState, useEffect } from "react";
import { ledgerFetchUrl } from "@/lib/ledger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Wallet } from "lucide-react";

type Account = {
  id: string;
  ledgerId: string;
  name: string;
  type: string;
  balance: number;
  initialBalance: number;
  icon: string | null;
  color: string | null;
  sortOrder: number;
};

const typeLabels: Record<string, string> = {
  cash: "现金",
  bank: "银行卡",
  credit: "信用卡",
  alipay: "支付宝",
  wechat: "微信",
  investment: "投资账户",
  liability: "负债账户",
};

const typeColors: Record<string, string> = {
  cash: "#22c55e",
  bank: "#3b82f6",
  credit: "#ef4444",
  alipay: "#1677ff",
  wechat: "#07c160",
  investment: "#f59e0b",
  liability: "#dc2626",
};

const emptyForm = {
  name: "",
  type: "cash",
  initialBalance: 0,
  color: "",
  sortOrder: 0,
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadAccounts = async () => {
    try {
      const res = await fetch(ledgerFetchUrl("/api/accounts"));
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setAccounts(data);
    } catch {
      toast("加载账户失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const totalBalance = accounts.reduce(
    (sum, a) =>
      a.type === "liability" || a.type === "credit"
        ? sum - a.balance
        : sum + a.balance,
    0,
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditing(account);
    setForm({
      name: account.name,
      type: account.type,
      initialBalance: account.initialBalance,
      color: account.color || "",
      sortOrder: account.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast("请输入账户名称");
      return;
    }

    try {
      const url = ledgerFetchUrl("/api/accounts");
      const method = editing ? "PUT" : "POST";
      const body = {
        ...(editing && { id: editing.id }),
        name: form.name,
        type: form.type,
        initialBalance: form.initialBalance,
        color: form.color || undefined,
        sortOrder: form.sortOrder,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast(editing ? "账户已更新" : "账户已创建");
      setDialogOpen(false);
      loadAccounts();
    } catch {
      toast("保存失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此账户吗？")) return;

    try {
      const res = await fetch(ledgerFetchUrl("/api/accounts"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast("账户已删除");
      loadAccounts();
    } catch {
      toast("删除失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">账户管理</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          新增账户
        </Button>
      </div>

      {/* Total Assets Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            总资产
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-3xl font-bold ${totalBalance >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            ¥{totalBalance.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Account Grid */}
      {loading ? (
        <p className="text-sm text-muted-foreground">加载中...</p>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Wallet className="mb-2 size-8" />
          <p className="text-sm">暂无账户</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{
                        backgroundColor:
                          account.color ||
                          typeColors[account.type] ||
                          "#6b7280",
                      }}
                    />
                    <CardTitle className="text-sm">{account.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(account)}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">类型</span>
                    <span className="text-xs font-medium">
                      {typeLabels[account.type] || account.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">余额</span>
                    <span
                      className={`text-sm font-semibold ${
                        account.type === "liability" || account.type === "credit"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      ¥{account.balance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      初始金额
                    </span>
                    <span className="text-sm">
                      ¥{account.initialBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "编辑账户" : "新增账户"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="账户名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">类型</label>
              <Select
                value={form.type}
                onValueChange={(value) => {
                  if (value) setForm({ ...form, type: value });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      value ? typeLabels[value] || value : null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">初始金额</label>
              <Input
                type="number"
                step="0.01"
                value={form.initialBalance}
                onChange={(e) =>
                  setForm({
                    ...form,
                    initialBalance: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>
                {editing ? "更新" : "创建"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
