"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { registerSchema, type RegisterInput } from "@financial-system/types";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@financial-system/ui";

import { apiFetch } from "@/lib/api";
import { writeSession, type SessionState } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      realName: "",
      phone: "",
      email: ""
    }
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      try {
        const session = await apiFetch<SessionState>("/auth/register", {
          method: "POST",
          body: JSON.stringify(values)
        });
        writeSession(session);
        router.push("/employee/dashboard");
      } catch (error) {
        setError("confirmPassword", {
          message: error instanceof Error ? error.message : "\u6ce8\u518c\u5931\u8d25"
        });
      }
    });
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-[980px] rounded-[28px] border-white/70 bg-white/90 shadow-2xl shadow-slate-900/10">
        <CardHeader>
          <CardTitle>{"\u5458\u5de5\u6ce8\u518c"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
            <label className="grid gap-2 text-sm">
              <span>{"\u7528\u6237\u540d"}</span>
              <Input {...register("username")} />
            </label>
            <label className="grid gap-2 text-sm">
              <span>{"\u771f\u5b9e\u59d3\u540d"}</span>
              <Input {...register("realName")} />
            </label>
            <label className="grid gap-2 text-sm">
              <span>{"\u5bc6\u7801"}</span>
              <Input type="password" {...register("password")} />
            </label>
            <label className="grid gap-2 text-sm">
              <span>{"\u786e\u8ba4\u5bc6\u7801"}</span>
              <Input type="password" {...register("confirmPassword")} />
            </label>
            <label className="grid gap-2 text-sm">
              <span>{"\u624b\u673a\u53f7"}</span>
              <Input {...register("phone")} />
            </label>
            <label className="grid gap-2 text-sm">
              <span>{"\u90ae\u7bb1"}</span>
              <Input {...register("email")} />
            </label>
            <div className="md:col-span-2 min-h-5 text-sm text-rose-600">{Object.values(errors)[0]?.message as string}</div>
            <Button
              type="submit"
              className="md:col-span-2 w-full shadow-sm"
              style={{ backgroundColor: "#0f172a", color: "#ffffff", width: "100%", minHeight: "44px" }}
              disabled={pending}
            >
              {pending ? "\u6ce8\u518c\u4e2d..." : "\u786e\u8ba4\u6ce8\u518c"}
            </Button>
            <Link className="md:col-span-2 text-sm font-medium text-blue-700" href="/login">
              {"\u5df2\u6709\u8d26\u53f7\uff0c\u8fd4\u56de\u767b\u5f55"}
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}