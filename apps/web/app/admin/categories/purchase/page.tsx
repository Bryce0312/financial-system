"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { RoleCode } from "@financial-system/types";

import {
  Badge,
  Button,
  ConfigActionBar,
  ConfigEditorCard,
  ConfigField,
  ConfigPageGrid,
  ConfigPageLayout,
  ConfigStatusCard,
  ConfigTableCard,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/admin-config-page";
import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";

type PurchaseCategory = {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  enabled: boolean;
};

type CreateForm = {
  name: string;
  code: string;
  sortOrder: number;
};

type EditForm = {
  id: string;
  name: string;
  sortOrder: number;
  enabled: boolean;
};

export default function PurchaseCategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PurchaseCategory | null>(null);

  const createForm = useForm<CreateForm>({ defaultValues: { name: "", code: "", sortOrder: 0 } });
  const editForm = useForm<EditForm>({ defaultValues: { id: "", name: "", sortOrder: 0, enabled: true } });

  const list = useQuery({
    queryKey: ["admin-purchase-categories"],
    queryFn: () => apiFetch<PurchaseCategory[]>("/purchase-categories")
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateForm) =>
      apiFetch("/purchase-categories", {
        method: "POST",
        body: JSON.stringify({ ...values, enabled: true, sortOrder: Number(values.sortOrder) })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-purchase-categories"] });
      createForm.reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (values: EditForm) =>
      apiFetch(`/purchase-categories/${values.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name,
          sortOrder: Number(values.sortOrder),
          enabled: values.enabled
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-purchase-categories"] });
      setEditing(null);
    }
  });

  const items = list.data || [];
  const stats = useMemo(() => {
    const enabledCount = items.filter((item) => item.enabled).length;
    return [
      { label: "总数", value: items.length },
      { label: "启用", value: enabledCount },
      { label: "停用", value: items.length - enabledCount }
    ];
  }, [items]);

  const resetCreate = () => {
    setEditing(null);
    createForm.reset({ name: "", code: "", sortOrder: 0 });
  };

  const startEdit = (item: PurchaseCategory) => {
    setEditing(item);
    editForm.reset({
      id: item.id,
      name: item.name,
      sortOrder: item.sortOrder,
      enabled: item.enabled
    });
  };

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <ConfigPageLayout
        title="采购分类"
        description="维护采购报销中的结构化分类。编码创建后锁定，停用后不会影响历史采购记录和统计。"
        actions={
          <Button variant="secondary" onClick={resetCreate}>
            新建采购分类
          </Button>
        }
      >
        <ConfigPageGrid>
          <ConfigTableCard title="采购分类清单" description="名称和排序可持续调整，停用后员工端采购明细不再出现该选项。" stats={stats}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>名称</TableHeader>
                  <TableHeader>编码</TableHeader>
                  <TableHeader>排序</TableHeader>
                  <TableHeader>状态</TableHeader>
                  <TableHeader>操作</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{item.code}</TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={item.enabled ? "success" : "warning"}>{item.enabled ? "启用中" : "已停用"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="outline" onClick={() => startEdit(item)}>
                        编辑
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ConfigTableCard>

          <ConfigEditorCard
            eyebrow={editing ? "Edit purchase category" : "Create purchase category"}
            title={editing ? `编辑 ${editing.name}` : "新增采购分类"}
            description={editing ? "采购分类只开放名称、排序和启停，避免影响历史采购记录解释。" : "新增后即可在采购报销的结构化明细中使用。"}
          >
            {editing ? (
              <form className="space-y-5" onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}>
                <ConfigField label="分类名称">
                  <Input placeholder="例如：办公设备 / 软件服务" {...editForm.register("name")} />
                </ConfigField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ConfigField label="分类编码" hint="锁定">
                    <Input value={editing.code} disabled className="cursor-not-allowed bg-slate-50 text-slate-400" />
                  </ConfigField>
                  <ConfigField label="排序">
                    <Input type="number" placeholder="数字越小越靠前" {...editForm.register("sortOrder", { valueAsNumber: true })} />
                  </ConfigField>
                </div>
                <ConfigStatusCard
                  title="分类启停"
                  description="停用后员工端采购报销不再可选，历史采购数据仍保留当前分类名称。"
                  activeLabel="启用中"
                  inactiveLabel="已停用"
                  enabled={editForm.watch("enabled")}
                  onToggle={() => editForm.setValue("enabled", !editForm.getValues("enabled"))}
                />
                <ConfigActionBar onCancel={() => setEditing(null)} submitLabel="保存修改" isSubmitting={updateMutation.isPending} />
                {updateMutation.error ? <p className="text-sm text-rose-600">{updateMutation.error.message}</p> : null}
              </form>
            ) : (
              <form className="space-y-5" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
                <ConfigField label="分类名称">
                  <Input placeholder="例如：办公设备 / 品牌物料" {...createForm.register("name")} />
                </ConfigField>
                <ConfigField label="分类编码" hint="创建后锁定">
                  <Input placeholder="例如：OFFICE_EQUIPMENT" {...createForm.register("code")} />
                </ConfigField>
                <ConfigField label="排序">
                  <Input type="number" placeholder="默认 0" {...createForm.register("sortOrder", { valueAsNumber: true })} />
                </ConfigField>
                <ConfigActionBar onCancel={resetCreate} cancelLabel="清空" submitLabel="创建分类" isSubmitting={createMutation.isPending} />
                {createMutation.error ? <p className="text-sm text-rose-600">{createMutation.error.message}</p> : null}
              </form>
            )}
          </ConfigEditorCard>
        </ConfigPageGrid>
      </ConfigPageLayout>
    </AppShell>
  );
}

