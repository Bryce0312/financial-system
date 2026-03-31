"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ExpenseExtensionType, RoleCode } from "@financial-system/types";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";

export default function ExpenseCategoriesPage() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      code: "",
      enabled: true,
      limitEnabled: false,
      invoiceRequired: false,
      extensionType: ExpenseExtensionType.NONE,
      sortOrder: 0
    }
  });
  const list = useQuery({ queryKey: ["admin-expense-categories"], queryFn: () => apiFetch<any[]>("/expense-categories") });
  const mutation = useMutation({
    mutationFn: (values: any) =>
      apiFetch("/expense-categories", {
        method: "POST",
        body: JSON.stringify({ ...values, enabled: true, limitEnabled: false, invoiceRequired: false, sortOrder: Number(values.sortOrder) })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expense-categories"] });
      reset();
    }
  });

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>报销分类列表</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>名称</TableHeader>
                  <TableHeader>编码</TableHeader>
                  <TableHeader>扩展类型</TableHeader>
                  <TableHeader>要求发票</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.extensionType}</TableCell>
                    <TableCell>{item.invoiceRequired ? "是" : "否"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>新增报销分类</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input placeholder="分类名称" {...register("name")} />
            <Input placeholder="分类编码" {...register("code")} />
            <Select {...register("extensionType")}>
              <option value={ExpenseExtensionType.NONE}>普通</option>
              <option value={ExpenseExtensionType.TRAVEL}>差旅</option>
              <option value={ExpenseExtensionType.PURCHASE}>采购</option>
            </Select>
            <Input type="number" placeholder="排序" {...register("sortOrder")} />
            <Button
              onClick={handleSubmit((values) => mutation.mutate(values))}
              disabled={mutation.isPending}
              style={{ backgroundColor: "#0f3d66", color: "#ffffff", minHeight: "44px" }}
            >
              {mutation.isPending ? "保存中..." : "确认新增报销分类"}
            </Button>
            {mutation.error ? <p className="text-sm text-rose-600">{mutation.error.message}</p> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}