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
import { toast } from "sonner";
import { Plus, Trash2, Shuffle } from "lucide-react";

type Condition = {
  field: string;
  operator: string;
  value: string;
};

type RuleItem = {
  id: string;
  name: string;
  matchMode: string;
  conditions: Condition[];
  actionCategoryId: string | null;
  priority: number;
};

type Category = {
  id: string;
  name: string;
  type: string;
  color: string | null;
};

const emptyCondition = { field: "note", operator: "contains", value: "" };

export default function RulesSettingsPage() {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [matchMode, setMatchMode] = useState("all");
  const [conditions, setConditions] = useState<Condition[]>([{ ...emptyCondition }]);
  const [actionCategoryId, setActionCategoryId] = useState("");

  const loadRules = async () => {
    try {
      const res = await fetch("/api/rules");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRules(data);
    } catch {
      toast("加载规则失败");
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

  useEffect(() => {
    loadRules();
    loadCategories();
  }, []);

  const handleConditionChange = (
    index: number,
    field: keyof Condition,
    value: string
  ) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const addCondition = () => {
    setConditions([...conditions, { ...emptyCondition }]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length <= 1) return;
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast("请输入规则名称");
      return;
    }

    const validConditions = conditions.filter((c) => c.value.trim());
    if (validConditions.length === 0) {
      toast("请至少填写一个条件");
      return;
    }

    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          matchMode,
          conditions: validConditions,
          actionCategoryId: actionCategoryId || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast("规则已创建");
      setName("");
      setMatchMode("all");
      setConditions([{ ...emptyCondition }]);
      setActionCategoryId("");
      setOpen(false);
      loadRules();
    } catch {
      toast("创建失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此规则吗？")) return;

    try {
      const res = await fetch("/api/rules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast("规则已删除");
      loadRules();
    } catch {
      toast("删除失败");
    }
  };

  const fieldLabels: Record<string, string> = {
    note: "备注",
    merchant: "商户",
    amount: "金额",
  };

  const operatorLabels: Record<string, string> = {
    contains: "包含",
    equals: "等于",
    startsWith: "开头是",
    regex: "正则匹配",
  };

  const matchModeLabels: Record<string, string> = {
    all: "全部满足",
    any: "满足任一",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">自动分类规则</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-1 size-4" />
                创建规则
              </Button>
            }
          />
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>创建规则</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">规则名称</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：超市购物自动分类"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">匹配模式</label>
                <Select value={matchMode} onValueChange={(v) => setMatchMode(v ?? "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部满足</SelectItem>
                    <SelectItem value="any">满足任一</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">条件</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCondition}
                  >
                    <Plus className="mr-1 size-3" />
                    添加条件
                  </Button>
                </div>
                {conditions.map((cond, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={cond.field}
                      onValueChange={(v) =>
                        handleConditionChange(i, "field", v ?? "")
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">备注</SelectItem>
                        <SelectItem value="merchant">商户</SelectItem>
                        <SelectItem value="amount">金额</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={cond.operator}
                      onValueChange={(v) =>
                        handleConditionChange(i, "operator", v ?? "")
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">包含</SelectItem>
                        <SelectItem value="equals">等于</SelectItem>
                        <SelectItem value="startsWith">开头是</SelectItem>
                        <SelectItem value="regex">正则匹配</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={cond.value}
                      onChange={(e) =>
                        handleConditionChange(i, "value", e.target.value)
                      }
                      placeholder="值"
                      className="flex-1"
                    />
                    {conditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeCondition(i)}
                      >
                        <Trash2 className="size-3.5 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  目标分类（自动设置）
                </label>
                <Select
                  value={actionCategoryId}
                  onValueChange={(v) => setActionCategoryId(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">不自动分类</SelectItem>
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

      <div>
        {loading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Shuffle className="mb-2 size-8" />
            <p className="text-sm">暂无规则</p>
            <p className="mt-1 text-xs">
              创建规则可以根据备注或商户自动分类交易
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">
                      匹配方式：{matchModeLabels[rule.matchMode] || rule.matchMode}
                      {" · "}
                      {rule.conditions.length} 个条件
                      {rule.actionCategoryId && " · 自动分类"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.conditions.map((cond, ci) => (
                        <span
                          key={ci}
                          className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs"
                        >
                          {fieldLabels[cond.field] || cond.field}{" "}
                          {operatorLabels[cond.operator] || cond.operator}{" "}
                          &quot;{cond.value}&quot;
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(rule.id)}
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
