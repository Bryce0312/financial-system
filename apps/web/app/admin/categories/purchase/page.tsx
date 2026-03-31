"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { RoleCode } from "@financial-system/types";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";

export default function PurchaseCategoriesPage() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: "", code: "", sortOrder: 0 } });
  const list = useQuery({ queryKey: ["admin-purchase-categories"], queryFn: () => apiFetch<any[]>("/purchase-categories") });
  const mutation = useMutation({
    mutationFn: (values: any) =>
      apiFetch("/purchase-categories", {
        method: "POST",
        body: JSON.stringify({ ...values, enabled: true, sortOrder: Number(values.sortOrder) })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-purchase-categories"] });
      reset();
    }
  });

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>采购分类列表</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>名称</TableHeader>
                  <TableHeader>编码</TableHeader>
                  <TableHeader>排序</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>新增采购分类</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input placeholder="分类名称" {...register("name")} />
            <Input placeholder="分类编码" {...register("code")} />
            <Input type="number" placeholder="排序" {...register("sortOrder")} />
            <Button
              onClick={handleSubmit((values) => mutation.mutate(values))}
              disabled={mutation.isPending}
              style={{ backgroundColor: "#0f3d66", color: "#ffffff", minHeight: "44px" }}
            >
              {mutation.isPending ? "保存中..." : "确认新增采购分类"}
            </Button>
            {mutation.error ? <p className="text-sm text-rose-600">{mutation.error.message}</p> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}