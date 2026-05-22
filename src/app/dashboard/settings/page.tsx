"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Plus, Book, Users, Trash2 } from "lucide-react";

type LedgerItem = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
};

type MemberItem = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

const roleLabels: Record<string, string> = {
  owner: "所有者",
  admin: "管理员",
  editor: "编辑者",
  viewer: "查看者",
};

const typeLabels: Record<string, string> = {
  personal: "个人",
  family: "家庭",
  business: "生意",
  joint: "共同",
};

export default function SettingsPage() {
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("personal");

  const loadData = async () => {
    try {
      const [ledgersRes, membersRes] = await Promise.all([
        fetch("/api/ledgers"),
        fetch("/api/members"),
      ]);
      if (ledgersRes.ok) setLedgers(await ledgersRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
    } catch {
      toast("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLedger = async () => {
    if (!name.trim()) {
      toast("请输入账本名称");
      return;
    }

    try {
      const res = await fetch("/api/ledgers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type }),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast("账本已创建");
      setName("");
      setType("personal");
      setOpen(false);
      loadData();
    } catch {
      toast("创建失败");
    }
  };

  const handleDeleteLedger = async (ledger: LedgerItem) => {
    if (!confirm(`确定删除账本「${ledger.name}」？此操作将清除该账本下的所有交易记录、分类、账户、预算等数据，且不可恢复。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/ledgers?ledgerId=${ledger.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast("账本已删除");
      loadData();
      // 跳转到其他账本（如果有）
      const remaining = ledgers.filter((l) => l.id !== ledger.id);
      if (remaining.length > 0) {
        localStorage.setItem("activeLedgerId", remaining[0].id);
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      toast("删除失败");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">设置</h1>

      {/* 账本管理 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Book className="size-4" />
              账本管理
            </CardTitle>
            <CardDescription>管理你的账本</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
            render={
              <Button size="sm">
                <Plus className="mr-1 size-4" />
                新建账本
              </Button>
            }
          />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建账本</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">名称</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="账本名称"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">类型</label>
                  <Select value={type} onValueChange={(v) => setType(v ?? "personal")}>
                    <SelectTrigger>
                      <SelectValue />
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
                <Button onClick={handleCreateLedger} className="w-full">
                  创建
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : ledgers.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无账本</p>
          ) : (
            <div className="space-y-2">
              {ledgers.map((ledger) => (
                <div
                  key={ledger.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{ledger.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {typeLabels[ledger.type] || ledger.type}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteLedger(ledger)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 成员管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            成员管理
          </CardTitle>
          <CardDescription>当前账本的成员列表</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无成员</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {(member.user.name || member.user.email)[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.user.name || "未设置名称"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {roleLabels[member.role] || member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
