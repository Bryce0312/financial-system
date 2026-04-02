"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { RoleCode } from "@financial-system/types";
import { Button, cn } from "@financial-system/ui";

import { clearSession, readSession, type SessionState } from "@/lib/auth";

const employeeNav = [
  { href: "/employee/dashboard", label: "\u6211\u7684\u9996\u9875", note: "Overview" },
  { href: "/employee/expenses", label: "\u6211\u7684\u62a5\u9500", note: "Claims" },
  { href: "/employee/expenses/new", label: "\u65b0\u5efa\u62a5\u9500", note: "New" }
];

const adminNav = [
  { href: "/admin", label: "\u7ba1\u7406\u9996\u9875", note: "Control" },
  { href: "/admin/expenses", label: "\u62a5\u9500\u8bb0\u5f55", note: "Records" },
  { href: "/admin/anomalies", label: "\u5f02\u5e38\u8bb0\u5f55", note: "Alerts" },
  { href: "/admin/categories/expense", label: "\u62a5\u9500\u5206\u7c7b", note: "Expense" },
  { href: "/admin/categories/purchase", label: "\u91c7\u8d2d\u5206\u7c7b", note: "Purchase" },
  { href: "/admin/rules", label: "\u89c4\u5219\u7ba1\u7406", note: "Rules" },
  { href: "/admin/exports", label: "\u5bfc\u51fa\u4e2d\u5fc3", note: "Export" }
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
    return <main className="app-shell-page app-shell-page--loading">{"\u9875\u9762\u52a0\u8f7d\u4e2d..."}</main>;
  }

  if (!session) {
    return <main className="app-shell-page app-shell-page--loading">{"\u6b63\u5728\u8df3\u8f6c\u5230\u767b\u5f55\u9875..."}</main>;
  }

  const isAdmin = session.user.roles.includes(RoleCode.ADMIN);
  const nav = isAdmin ? adminNav : employeeNav;
  const workbenchLabel = isAdmin ? "\u7ba1\u7406\u5458\u5de5\u4f5c\u53f0" : "\u5458\u5de5\u5de5\u4f5c\u53f0";
  const tipText = isAdmin
    ? "\u67e5\u770b\u5f02\u5e38\u3001\u7edf\u8ba1\u548c\u5bfc\u51fa\uff0c\u4f18\u5148\u5904\u7406\u9ad8\u9891\u95ee\u9898\u3002"
    : "\u5148\u5efa\u62a5\u9500\uff0c\u518d\u8865\u9644\u4ef6\uff0c\u6700\u540e\u68c0\u67e5\u5f02\u5e38\u6807\u7b7e\u3002";

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
              <h2 className="app-sidebar__title">{"\u667a\u80fd\u62a5\u8d26\u5e73\u53f0"}</h2>
            </div>
          </div>

          <div className="app-sidebar__user">
            <strong>{session.user.realName}</strong>
            <span>{workbenchLabel}</span>
          </div>

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
            {"\u9000\u51fa\u767b\u5f55"}
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