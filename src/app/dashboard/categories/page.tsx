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
import { Plus, Edit2, Trash2 } from "lucide-react";

type Category = {
  id: string;
  ledgerId: string;
  name: string;
  parentId: string | null;
  type: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  children: Category[];
};

const emptyForm = {
  name: "",
  type: "expense",
  color: "#3b82f6",
  parentId: "",
  sortOrder: 0,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadCategories = async () => {
    try {
      const res = await fetch(ledgerFetchUrl("/api/categories"));
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCategories(data);
    } catch {
      toast("加载分类失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = (type: string) => {
    setEditing(null);
    setForm({ ...emptyForm, type });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      type: cat.type,
      color: cat.color || "#3b82f6",
      parentId: cat.parentId || "",
      sortOrder: cat.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast("请输入分类名称");
      return;
    }

    try {
      const url = "/api/categories";
      const method = editing ? "PUT" : "POST";
      const body = {
        ...(editing && { id: editing.id }),
        name: form.name,
        type: form.type,
        color: form.color,
        parentId: form.parentId || undefined,
        sortOrder: form.sortOrder,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast(editing ? "分类已更新" : "分类已创建");
      setDialogOpen(false);
      loadCategories();
    } catch {
      toast("保存失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此分类吗？")) return;

    try {
      const res = await fetch(ledgerFetchUrl("/api/categories"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast("分类已删除");
      loadCategories();
    } catch {
      toast("删除失败");
    }
  };

  const getDescendantIds = (catId: string): string[] => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return [];
    const ids: string[] = [];
    const collect = (children: Category[]) => {
      for (const child of children) {
        ids.push(child.id);
        collect(child.children);
      }
    };
    collect(cat.children);
    return ids;
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">分类管理</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-600">支出分类</CardTitle>
              <Button size="sm" onClick={() => openCreate("expense")}>
                <Plus className="size-4" />
                新增
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">加载中...</p>
            ) : expenseCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无支出分类</p>
            ) : (
              <div className="space-y-2">
                {expenseCategories.map((cat) => (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-3 rounded-full"
                          style={{
                            backgroundColor: cat.color || "#ef4444",
                          }}
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(cat)}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(cat.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    {cat.children.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {cat.children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between rounded-lg border border-dashed px-3 py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="size-2.5 rounded-full"
                                style={{
                                  backgroundColor: child.color || "#ef4444",
                                }}
                              />
                              <span className="text-xs">{child.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => openEdit(child)}
                              >
                                <Edit2 className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleDelete(child.id)}
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-600">收入分类</CardTitle>
              <Button size="sm" onClick={() => openCreate("income")}>
                <Plus className="size-4" />
                新增
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">加载中...</p>
            ) : incomeCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无收入分类</p>
            ) : (
              <div className="space-y-2">
                {incomeCategories.map((cat) => (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-3 rounded-full"
                          style={{
                            backgroundColor: cat.color || "#22c55e",
                          }}
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(cat)}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(cat.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    {cat.children.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {cat.children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between rounded-lg border border-dashed px-3 py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="size-2.5 rounded-full"
                                style={{
                                  backgroundColor: child.color || "#22c55e",
                                }}
                              />
                              <span className="text-xs">{child.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => openEdit(child)}
                              >
                                <Edit2 className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleDelete(child.id)}
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "编辑分类" : "新增分类"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名称</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="分类名称"
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
                      value === "expense" ? "支出" : value === "income" ? "收入" : null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">支出</SelectItem>
                  <SelectItem value="income">收入</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">父分类（可选）</label>
              <Select
                value={form.parentId}
                onValueChange={(value) => {
                  const val = value ?? "";
                  setForm({ ...form, parentId: val });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="无（顶级分类）">
                    {(value: string | null) => {
                      if (!value) return null;
                      const parent = categories.find((c) => c.id === value);
                      return parent ? parent.name : value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无（顶级分类）</SelectItem>
                  {categories
                    .filter((c) => c.type === form.type && c.id !== editing?.id && !getDescendantIds(editing?.id ?? '').includes(c.id))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">颜色</label>
              <Input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
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
