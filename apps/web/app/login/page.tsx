"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { RoleCode, loginSchema, type LoginInput } from "@financial-system/types";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@financial-system/ui";

import { apiFetch } from "@/lib/api";
import { writeSession, type SessionState } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      try {
        const session = await apiFetch<SessionState>("/auth/login", {
          method: "POST",
          body: JSON.stringify(values)
        });
        writeSession(session);
        router.push(session.user.roles.includes(RoleCode.ADMIN) ? "/admin" : "/employee/dashboard");
      } catch (error) {
        setError("password", {
          message: error instanceof Error ? error.message : "\u767b\u5f55\u5931\u8d25"
        });
      }
    });
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md rounded-[28px] border-white/70 bg-white/90 shadow-2xl shadow-slate-900/10">
        <CardHeader>
          <CardTitle>{"\u767b\u5f55\u667a\u80fd\u62a5\u8d26\u5e73\u53f0"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={onSubmit}>
            <label className="grid gap-2 text-sm">
              <span>{"\u7528\u6237\u540d"}</span>
              <Input {...register("username")} />
            </label>
            <label className="grid gap-2 text-sm">
              <span>{"\u5bc6\u7801"}</span>
              <Input type="password" {...register("password")} />
            </label>
            <div className="min-h-5 text-sm text-rose-600">{Object.values(errors)[0]?.message as string}</div>
            <Button
              type="submit"
              className="w-full shadow-sm"
              style={{ backgroundColor: "#0f172a", color: "#ffffff", width: "100%", minHeight: "44px" }}
              disabled={pending}
            >
              {pending ? "\u767b\u5f55\u4e2d..." : "\u767b\u5f55"}
            </Button>
            <Link className="text-sm font-medium text-blue-700" href="/register">
              {"\u65b0\u5458\u5de5\u6ce8\u518c\u5165\u53e3"}
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}