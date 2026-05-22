"use client";

import { useState, useEffect, useCallback } from "react";
import { ledgerFetchUrl } from "@/lib/ledger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type TransactionType = "expense" | "income" | "transfer";

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
  balance: number;
};

type Tag = {
  id: string;
  name: string;
  color: string | null;
};

export type TransactionFormData = {
  id?: string;
  type: TransactionType;
  amount: number;
  date: string;
  note: string;
  categoryId: string;
  accountId: string;
  toAccountId: string;
  merchant: string;
  tagIds: string[];
};

interface TransactionFormProps {
  initialData?: Partial<TransactionFormData>;
  onSave: () => void;
  onCancel: () => void;
}

const defaultForm: TransactionFormData = {
  type: "expense",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
  note: "",
  categoryId: "",
  accountId: "",
  toAccountId: "",
  merchant: "",
  tagIds: [],
};

const typeOptions: { value: TransactionType; label: string; color: string }[] = [
  { value: "expense", label: "支出", color: "text-red-600" },
  { value: "income", label: "收入", color: "text-green-600" },
  { value: "transfer", label: "转账", color: "text-blue-600" },
];

export function TransactionForm({
  initialData,
  onSave,
  onCancel,
}: TransactionFormProps) {
  const [form, setForm] = useState<TransactionFormData>({
    ...defaultForm,
    ...initialData,
    amount: initialData?.amount ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const updateForm = useCallback(
    (partial: Partial<TransactionFormData>) => {
      setForm((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  // Load categories, accounts, tags
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [catRes, accRes, tagRes] = await Promise.all([
          fetch(ledgerFetchUrl("/api/categories")),
          fetch(ledgerFetchUrl("/api/accounts")),
          fetch(ledgerFetchUrl("/api/tags")),
        ]);
        if (catRes.ok) setCategories(await catRes.json());
        if (accRes.ok) setAccounts(await accRes.json());
        if (tagRes.ok) setTags(await tagRes.json());
      } catch {
        // Silently fail - forms will just show empty selectors
      } finally {
        setLoadingMeta(false);
      }
    };
    loadMeta();
  }, []);

  // Auto-categorization via rules
  useEffect(() => {
    if (!form.merchant && !form.note) return;

    const matchRules = async () => {
      try {
        const res = await fetch(ledgerFetchUrl("/api/rules"));
        if (!res.ok) return;
        const rules: {
          id: string;
          conditions: string;
          matchMode: string;
          actionCategoryId: string | null;
          actionAccountId: string | null;
          actionTagIds: string | null;
          priority: number;
        }[] = await res.json();

        if (!rules || rules.length === 0) return;

        const searchText = (form.merchant + " " + form.note).toLowerCase();

        // Try to find a matching rule
        for (const rule of rules.sort((a, b) => b.priority - a.priority)) {
          let conditions: { field: string; value: string }[] = [];
          try {
            conditions = JSON.parse(rule.conditions);
          } catch {
            continue;
          }

          const allMatch = conditions.every((c) => {
            if (c.field === "merchant") return searchText.includes(c.value.toLowerCase());
            if (c.field === "note") return searchText.includes(c.value.toLowerCase());
            return false;
          });
          const anyMatch = conditions.some((c) => {
            if (c.field === "merchant") return searchText.includes(c.value.toLowerCase());
            if (c.field === "note") return searchText.includes(c.value.toLowerCase());
            return false;
          });

          const matched =
            rule.matchMode === "all" ? allMatch : anyMatch;

          if (matched) {
            const updates: Partial<TransactionFormData> = {};

            if (rule.actionCategoryId && !initialData?.categoryId) {
              const catExists = categories.some(
                (c) => c.id === rule.actionCategoryId
              );
              if (catExists) updates.categoryId = rule.actionCategoryId;
            }
            if (rule.actionAccountId && !initialData?.accountId) {
              const accExists = accounts.some(
                (a) => a.id === rule.actionAccountId
              );
              if (accExists) updates.accountId = rule.actionAccountId;
            }
            if (rule.actionTagIds && !initialData?.tagIds?.length) {
              try {
                const parsedTagIds = JSON.parse(rule.actionTagIds);
                if (Array.isArray(parsedTagIds)) {
                  updates.tagIds = parsedTagIds.filter((tid: string) =>
                    tags.some((t) => t.id === tid)
                  );
                }
              } catch {
                // ignore invalid tagIds json
              }
            }

            if (Object.keys(updates).length > 0) {
              setForm((prev) => ({ ...prev, ...updates }));
            }
            break;
          }
        }
      } catch {
        // Rules API may not exist yet
      }
    };

    // Debounce the auto-match
    const timer = setTimeout(matchRules, 500);
    return () => clearTimeout(timer);
  }, [form.merchant, form.note, categories, accounts, tags, initialData]);

  const filteredCategories = categories.filter(
    (c) => c.type === form.type || form.type === "transfer"
  );
  const filteredAccounts = accounts.filter(
    (a) => a.type !== "liability" || form.type !== "expense"
  );

  const handleSubmit = async () => {
    if (form.amount <= 0) {
      toast("金额必须大于0");
      return;
    }
    if (!form.date) {
      toast("请选择日期");
      return;
    }

    setSaving(true);
    try {
      const isEditing = !!(initialData as any)?.id;
      const url = isEditing
        ? `/api/transactions/${(initialData as any).id}`
        : "/api/transactions";
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        type: form.type,
        amount: form.amount,
        date: form.date,
      };

      if (form.note) body.note = form.note;
      if (form.categoryId) body.categoryId = form.categoryId;
      if (form.accountId) body.accountId = form.accountId;
      if (form.type === "transfer" && form.toAccountId)
        body.toAccountId = form.toAccountId;
      if (form.merchant) body.merchant = form.merchant;
      if (form.tagIds.length > 0) body.tagIds = form.tagIds;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const msg =
          errData?.error?.fieldErrors
            ? Object.values(errData.error.fieldErrors).flat().join("; ")
            : "操作失败";
        toast(msg);
        return;
      }

      toast(isEditing ? "流水已更新" : "流水已创建");
      onSave();
    } catch {
      toast("操作失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-2">
        {typeOptions.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant={form.type === opt.value ? "default" : "outline"}
            className={`flex-1 ${
              form.type === opt.value ? "" : opt.color
            }`}
            onClick={() =>
              updateForm({
                type: opt.value,
                toAccountId:
                  opt.value !== "transfer" ? "" : form.toAccountId,
              })
            }
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className="text-sm font-medium">金额</label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={form.amount || ""}
          onChange={(e) =>
            updateForm({ amount: parseFloat(e.target.value) || 0 })
          }
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">日期</label>
        <Input
          type="date"
          value={form.date}
          onChange={(e) => updateForm({ date: e.target.value })}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">分类</label>
        {loadingMeta ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            加载中...
          </div>
        ) : (
          <Select
            value={form.categoryId}
            onValueChange={(value) => { if (value) updateForm({ categoryId: value }); }}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择分类">
                  {(value: string | null) => {
                    if (!value) return null;
                    const cat = categories.find((c) => c.id === value);
                    return cat ? cat.name : value;
                  }}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    {cat.color && (
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Account */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {form.type === "transfer" ? "转出账户" : "账户"}
        </label>
        {loadingMeta ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            加载中...
          </div>
        ) : (
          <Select
            value={form.accountId}
            onValueChange={(value) => { if (value) updateForm({ accountId: value }); }}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择账户">
                {(value: string | null) => {
                  if (!value) return null;
                  const account = accounts.find((a) => a.id === value);
                  return account ? `${account.name} (¥${account.balance.toFixed(2)})` : value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name} (¥{acc.balance.toFixed(2)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* To-Account (only for transfer) */}
      {form.type === "transfer" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">转入账户</label>
          {loadingMeta ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              加载中...
            </div>
          ) : (
            <Select
              value={form.toAccountId}
              onValueChange={(value) => { if (value) updateForm({ toAccountId: value }); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择转入账户">
                  {(value: string | null) => {
                    if (!value) return null;
                    const account = accounts.find((a) => a.id === value);
                    return account ? `${account.name} (¥${account.balance.toFixed(2)})` : value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== form.accountId)
                  .map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} (¥{acc.balance.toFixed(2)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Merchant */}
      <div className="space-y-2">
        <label className="text-sm font-medium">商家</label>
        <Input
          placeholder="商家名称"
          value={form.merchant}
          onChange={(e) => updateForm({ merchant: e.target.value })}
        />
      </div>

      {/* Note */}
      <div className="space-y-2">
        <label className="text-sm font-medium">备注</label>
        <Input
          placeholder="备注信息"
          value={form.note}
          onChange={(e) => updateForm({ note: e.target.value })}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium">标签</label>
        {loadingMeta ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            加载中...
          </div>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无标签</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = form.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-all ${
                    selected
                      ? "text-white"
                      : "border border-input bg-background text-foreground hover:bg-accent"
                  }`}
                  style={
                    selected
                      ? { backgroundColor: tag.color || "#6b7280" }
                      : undefined
                  }
                  onClick={() => {
                    updateForm({
                      tagIds: selected
                        ? form.tagIds.filter((t) => t !== tag.id)
                        : [...form.tagIds, tag.id],
                    });
                  }}
                >
                  {!selected && tag.color && (
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="mr-1 size-4 animate-spin" />}
          {initialData?.id ? "更新" : "创建"}
        </Button>
      </div>
    </div>
  );
}
