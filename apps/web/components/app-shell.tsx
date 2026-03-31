"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { RoleCode } from "@financial-system/types";
import { Button, cn } from "@financial-system/ui";

import { clearSession, readSession, type SessionState } from "@/lib/auth";

const employeeNav = [
  { href: "/employee/dashboard", label: "我的首页" },
  { href: "/employee/expenses", label: "我的报销" },
  { href: "/employee/expenses/new", label: "新建报销" }
];

const adminNav = [
  { href: "/admin", label: "管理首页" },
  { href: "/admin/expenses", label: "报销记录" },
  { href: "/admin/anomalies", label: "异常记录" },
  { href: "/admin/categories/expense", label: "报销分类" },
  { href: "/admin/categories/purchase", label: "采购分类" },
  { href: "/admin/rules", label: "规则管理" },
  { href: "/admin/exports", label: "导出中心" }
];

export function AppShell({ children, requireRole }: { children: ReactNode; requireRole?: RoleCode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace("/login");
      return;
    }
    if (requireRole && !current.user.roles.includes(requireRole)) {
      router.replace(current.user.roles.includes(RoleCode.ADMIN) ? "/admin" : "/employee/dashboard");
      return;
    }
    setSession(current);
    setReady(true);
  }, [requireRole, router]);

  if (!ready || !session) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">正在加载...</main>;
  }

  const nav = session.user.roles.includes(RoleCode.ADMIN) ? adminNav : employeeNav;

  return (
    <main className="min-h-screen px-4 py-4 lg:px-6">
      <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[28px] border border-slate-900/5 bg-[#05091d] p-6 text-white shadow-2xl shadow-slate-900/15">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Financial</p>
            <h2 className="mt-3 text-[2.2rem] font-semibold leading-tight">智能报账平台</h2>
            <p className="mt-4 text-sm text-slate-300">{session.user.realName}</p>
          </div>
          <nav className="flex flex-col gap-2">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-base transition",
                    active
                      ? "bg-[#133b63] text-white shadow-lg shadow-cyan-950/20"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="secondary"
            className="mt-8 w-full border-0"
            style={{ backgroundColor: "#12385e", color: "#ffffff", minHeight: "44px" }}
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
          >
            退出登录
          </Button>
        </aside>
        <section className="rounded-[28px] border border-white/70 bg-white/88 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur">
          {children}
        </section>
      </div>
    </main>
  );
}