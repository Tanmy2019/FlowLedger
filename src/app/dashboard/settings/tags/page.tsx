"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, Tag } from "lucide-react";

type TagItem = {
  id: string;
  ledgerId: string;
  name: string;
  color: string | null;
};

const presetColors = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

export default function TagsSettingsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [color, setColor] = useState(presetColors[0]);

  const loadTags = async () => {
    try {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTags(data);
    } catch {
      toast("加载标签失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast("请输入标签名称");
      return;
    }

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast("标签已创建");
      setName("");
      setColor(presetColors[0]);
      loadTags();
    } catch {
      toast("创建失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此标签吗？")) return;

    try {
      const res = await fetch("/api/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast("标签已删除");
      loadTags();
    } catch {
      toast("删除失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">标签管理</h1>
      </div>

      {/* Inline create form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" />
            新增标签
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">名称</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="标签名称"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">颜色</label>
              <div className="flex items-center gap-1.5">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`size-6 rounded-full border-2 transition-all ${
                      color === c
                        ? "border-gray-900 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="size-4" />
              创建
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tags list */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          已有标签 ({tags.length})
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Tag className="mb-2 size-8" />
            <p className="text-sm">暂无标签</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {tags.map((tag) => (
              <Card key={tag.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-4 rounded-full"
                      style={{
                        backgroundColor: tag.color || "#6b7280",
                      }}
                    />
                    <span className="text-sm font-medium">{tag.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(tag.id)}
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
