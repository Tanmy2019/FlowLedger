"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LedgerSwitcher } from "@/components/layout/ledger-switcher";

const menuItems = [
  { href: "/dashboard", label: "仪表盘", icon: "📊" },
  { href: "/dashboard/transactions", label: "流水", icon: "💸" },
  { href: "/dashboard/accounts", label: "账户", icon: "🏦" },
  { href: "/dashboard/categories", label: "分类", icon: "🏷️" },
  { href: "/dashboard/budgets", label: "预算", icon: "💰" },
  { href: "/dashboard/statistics", label: "统计", icon: "📈" },
  { href: "/dashboard/settings", label: "设置", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r bg-white">
      <div className="border-b p-4">
        <LedgerSwitcher />
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-2">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({
                    variant: isActive ? "secondary" : "ghost",
                    size: "default",
                  }),
                  "w-full justify-start gap-3",
                  isActive && "font-medium",
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-4 text-xs text-muted-foreground">
        FlowLedger v0.1.0
      </div>
    </div>
  );
}
