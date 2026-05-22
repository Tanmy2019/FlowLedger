"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TransactionForm,
  TransactionFormData,
} from "@/components/transactions/transaction-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Plus,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  Search,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";

type TransactionTag = {
  tag: {
    id: string;
    name: string;
    color: string | null;
  };
};

type TransactionItem = {
  id: string;
  ledgerId: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  date: string;
  note: string | null;
  categoryId: string | null;
  accountId: string | null;
  toAccountId: string | null;
  merchant: string | null;
  category: {
    id: string;
    name: string;
    type: string;
    color: string | null;
  } | null;
  account: { id: string; name: string; type: string } | null;
  toAccount: { id: string; name: string; type: string } | null;
  tags: TransactionTag[];
};

const typeLabels: Record<string, string> = {
  expense: "支出",
  income: "收入",
  transfer: "转账",
};

const typeIcons: Record<string, typeof ArrowDown> = {
  expense: ArrowDown,
  income: ArrowUp,
  transfer: ArrowRightLeft,
};

const typeColors: Record<string, string> = {
  expense: "text-red-600",
  income: "text-green-600",
  transfer: "text-blue-600",
};

const typeBgColors: Record<string, string> = {
  expense: "bg-red-50",
  income: "bg-green-50",
  transfer: "bg-blue-50",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<
    (Partial<TransactionFormData> & { id: string }) | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");

  // 筛选选项数据
  type FilterCategory = { id: string; name: string; type: string };
  type FilterAccount = { id: string; name: string };

  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
  const [filterAccounts, setFilterAccounts] = useState<FilterAccount[]>([]);

  const limit = 50;

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (search.trim()) params.set("search", search.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (accountFilter !== "all") params.set("accountId", accountFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch {
      toast("加载流水失败");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search, startDate, endDate, categoryFilter, accountFilter, page]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

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

  // Group transactions by date
  const grouped = transactions.reduce<
    Record<string, TransactionItem[]>
  >((acc, tx) => {
    const dateKey = format(new Date(tx.date), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {});

  const totalPages = Math.ceil(total / limit);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const openCreate = () => {
    setEditingTx(null);
    setDialogOpen(true);
  };

  const openEdit = (tx: TransactionItem) => {
    setEditingTx({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      date: format(new Date(tx.date), "yyyy-MM-dd"),
      note: tx.note || "",
      categoryId: tx.categoryId || "",
      accountId: tx.accountId || "",
      toAccountId: tx.toAccountId || "",
      merchant: tx.merchant || "",
      tagIds: tx.tags.map((t) => t.tag.id),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
    setEditingTx(null);
    setSelectedIds(new Set());
    loadTransactions();
  };

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

  const totalPagesArr = Array.from(
    { length: Math.min(totalPages, 10) },
    (_, i) => {
      if (totalPages <= 10) return i + 1;
      // Smart pagination: show pages around current
      const half = Math.floor(10 / 2);
      let start = Math.max(1, page - half);
      const end = Math.min(totalPages, start + 9);
      if (end - start < 9) start = end - 9;
      return start + i;
    }
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">流水管理</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          记一笔
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3">
        <Select value={typeFilter} onValueChange={(value) => { if (value) setTypeFilter(value); }}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="expense">支出</SelectItem>
            <SelectItem value="income">收入</SelectItem>
            <SelectItem value="transfer">转账</SelectItem>
          </SelectContent>
        </Select>

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

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索备注、商家..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>

        <Input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          className="w-40"
          placeholder="开始日期"
        />
        <span className="text-sm text-muted-foreground">-</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
          className="w-40"
          placeholder="结束日期"
        />
      </div>

      {/* Batch Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            已选择 {selectedIds.size} 条
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBatchDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <Trash2 className="mr-1 size-3" />
            )}
            删除选中
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            取消选择
          </Button>
        </div>
      )}

      {/* Transaction List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          加载中...
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">暂无流水记录</p>
          <Button variant="link" onClick={openCreate}>
            记一笔
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, txs]) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="mb-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="shrink-0 text-sm font-medium text-muted-foreground">
                  {format(new Date(dateKey), "M月d日 EEEE", { locale: zhCN })}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Transactions for this date */}
              <div className="space-y-1">
                {txs.map((tx) => {
                  const Icon = typeIcons[tx.type];
                  const isSelected = selectedIds.has(tx.id);

                  return (
                    <div
                      key={tx.id}
                      className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 transition-colors hover:bg-accent/50 cursor-pointer ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => openEdit(tx)}
                    >
                      {/* Checkbox */}
                      <div
                        className="flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className={`flex size-5 items-center justify-center rounded border ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          }`}
                          onClick={() => toggleSelect(tx.id)}
                        >
                          {isSelected && <Check className="size-3" />}
                        </button>
                      </div>

                      {/* Type Icon */}
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${typeBgColors[tx.type]}`}
                      >
                        <Icon
                          className={`size-4 ${typeColors[tx.type]}`}
                        />
                      </div>

                      {/* Main Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {tx.category?.name || "未分类"}
                          </span>
                          {tx.merchant && (
                            <span className="text-xs text-muted-foreground">
                              {tx.merchant}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {tx.account && (
                            <span>{tx.account.name}</span>
                          )}
                          {tx.type === "transfer" && tx.toAccount && (
                            <>
                              <span>→</span>
                              <span>{tx.toAccount.name}</span>
                            </>
                          )}
                          {tx.note && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[200px]">
                                {tx.note}
                              </span>
                            </>
                          )}
                          {tx.tags.length > 0 && (
                            <>
                              <span>·</span>
                              <div className="flex items-center gap-1">
                                {tx.tags.map((tt) => (
                                  <span
                                    key={tt.tag.id}
                                    className="inline-block size-2 rounded-full"
                                    style={{
                                      backgroundColor:
                                        tt.tag.color || "#6b7280",
                                    }}
                                    title={tt.tag.name}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="shrink-0 text-right">
                        <span
                          className={`text-sm font-semibold ${typeColors[tx.type]}`}
                        >
                          {tx.type === "expense" ? "-" : "+"}¥
                          {tx.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          {totalPagesArr.map((p) => (
            <Button
              key={p}
              variant={page === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            下一页
          </Button>
          <span className="text-sm text-muted-foreground">
            共 {total} 条
          </span>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            setEditingTx(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTx ? "编辑流水" : "记一笔"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            initialData={editingTx || undefined}
            onSave={handleSave}
            onCancel={() => {
              setDialogOpen(false);
              setEditingTx(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
