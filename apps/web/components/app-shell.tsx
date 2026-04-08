"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { RoleCode } from "@financial-system/types";
import { Button, cn } from "@financial-system/ui";

import { clearSession, readSession, type SessionState } from "@/lib/auth";

const employeeNav = [
  { href: "/employee/dashboard", label: "我的首页", note: "Overview" },
  { href: "/employee/expenses", label: "我的报销", note: "Claims" },
  { href: "/employee/expenses/new", label: "新建报销", note: "New" }
];

const adminNav = [
  { href: "/admin", label: "管理首页", note: "Control" },
  { href: "/admin/expenses", label: "报销记录", note: "Records" },
  { href: "/admin/anomalies", label: "异常记录", note: "Alerts" },
  { href: "/admin/categories/expense", label: "报销分类", note: "Expense" },
  { href: "/admin/categories/purchase", label: "采购分类", note: "Purchase" },
  { href: "/admin/rules", label: "规则管理", note: "Rules" },
  { href: "/admin/exports", label: "导出中心", note: "Export" }
];

export function AppShell({ children, requireRole }: { children: ReactNode; requireRole?: RoleCode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = readSession();

    if (!current) {
      clearSession();
      setSession(null);
      setReady(true);
      router.replace("/login");
      return;
    }

    if (requireRole && !current.user.roles.includes(requireRole)) {
      setSession(null);
      setReady(true);
      router.replace(current.user.roles.includes(RoleCode.ADMIN) ? "/admin" : "/employee/dashboard");
      return;
    }

    setSession(current);
    setReady(true);
  }, [requireRole, router]);

  if (!ready) {
    return <main className="app-shell-page app-shell-page--loading">页面加载中...</main>;
  }

  if (!session) {
    return <main className="app-shell-page app-shell-page--loading">正在跳转到登录页...</main>;
  }

  const isAdmin = session.user.roles.includes(RoleCode.ADMIN);
  const nav = isAdmin ? adminNav : employeeNav;
  const workbenchLabel = isAdmin ? "管理员工作台" : "员工工作台";
  const tipText = isAdmin
    ? "查看异常、统计和导出，优先处理高频问题。"
    : "先建报销，再补附件，最后检查异常标签。";

  return (
    <main className="app-shell-page">
      <div className="app-shell-layout">
        <aside className="app-sidebar">
          <div className="app-sidebar__doodles" aria-hidden="true">
            <span className="app-sidebar__circle app-sidebar__circle--one" />
            <span className="app-sidebar__circle app-sidebar__circle--two" />
            <span className="app-sidebar__scribble app-sidebar__scribble--one" />
            <span className="app-sidebar__scribble app-sidebar__scribble--two" />
          </div>

          <div className="app-sidebar__brand">
            <div className="app-sidebar__mark">$</div>
            <div>
              <p className="app-sidebar__eyebrow">SMART REIMBURSEMENT</p>
              <h2 className="app-sidebar__title">智能报账平台</h2>
            </div>
          </div>

          <div className="app-sidebar__user">
            <strong>{session.user.realName}</strong>
            <span>{workbenchLabel}</span>
          </div>

          <div className="app-sidebar__navWrap">
            <nav className="app-sidebar__nav">
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("app-nav-link", active && "app-nav-link--active")}
                  >
                    <span className="app-nav-link__label">{item.label}</span>
                    <span className="app-nav-link__note">{item.note}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="app-sidebar__tip">
            <span>Guide</span>
            <p>{tipText}</p>
          </div>

          <Button
            variant="secondary"
            className="app-sidebar__logout"
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
          >
            退出登录
          </Button>
        </aside>

        <section className="app-content">
          <div className="app-content__frame">
            <div className="app-content__doodles" aria-hidden="true">
              <span className="app-content__line app-content__line--one" />
              <span className="app-content__line app-content__line--two" />
              <span className="app-content__blob app-content__blob--one" />
              <span className="app-content__blob app-content__blob--two" />
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
