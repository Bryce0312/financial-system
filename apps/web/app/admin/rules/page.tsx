"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { RoleCode } from "@financial-system/types";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";

export default function RulesPage() {
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ["rule-categories"], queryFn: () => apiFetch<any[]>("/expense-categories") });
  const list = useQuery({ queryKey: ["rules"], queryFn: () => apiFetch<any[]>("/rules") });
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      expenseCategoryId: "",
      limitAmount: 0,
      effectiveAt: new Date().toISOString().slice(0, 16),
      description: "",
      enabled: true
    }
  });
  const mutation = useMutation({
    mutationFn: (values: any) =>
      apiFetch("/rules", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          enabled: true,
          limitAmount: Number(values.limitAmount),
          effectiveAt: new Date(values.effectiveAt).toISOString()
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      reset();
    }
  });

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card>
          <CardHeader>
            <CardTitle>限额规则</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>规则名称</TableHeader>
                  <TableHeader>分类</TableHeader>
                  <TableHeader>限额</TableHeader>
                  <TableHeader>生效时间</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.expenseCategory.name}</TableCell>
                    <TableCell>{item.limitAmount}</TableCell>
                    <TableCell>{String(item.effectiveAt).slice(0, 10)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>新增规则</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input placeholder="规则名称" {...register("name")} />
            <Select {...register("expenseCategoryId")}>
              <option value="">选择报销分类</option>
              {categories.data?.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
            <Input type="number" step="0.01" placeholder="限额金额" {...register("limitAmount")} />
            <Input type="datetime-local" {...register("effectiveAt")} />
            <Input placeholder="规则说明" {...register("description")} />
            <Button
              onClick={handleSubmit((values) => mutation.mutate(values))}
              disabled={mutation.isPending}
              style={{ backgroundColor: "#0f3d66", color: "#ffffff", minHeight: "44px" }}
            >
              {mutation.isPending ? "保存中..." : "确认新增规则"}
            </Button>
            {mutation.error ? <p className="text-sm text-rose-600">{mutation.error.message}</p> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}