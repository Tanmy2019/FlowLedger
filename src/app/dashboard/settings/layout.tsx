"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Book,
  User,
  FileText,
  Shuffle,
  Upload,
  Tags,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/settings", label: "账本管理", icon: Book },
  { href: "/dashboard/settings/profile", label: "个人资料", icon: User },
  { href: "/dashboard/settings/tags", label: "标签管理", icon: Tags },
  { href: "/dashboard/settings/templates", label: "记账模板", icon: FileText },
  { href: "/dashboard/settings/rules", label: "自动分类规则", icon: Shuffle },
  { href: "/dashboard/settings/import", label: "数据导入", icon: Upload },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6">
      <aside className="w-48 shrink-0">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
