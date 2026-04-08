import { Injectable, NotFoundException } from "@nestjs/common";

import { ExpenseCategoryInput } from "@financial-system/types";

import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.expenseCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
  }

  create(input: ExpenseCategoryInput) {
    return this.prisma.expenseCategory.create({
      data: {
        name: input.name,
        code: input.code,
        extensionType: input.extensionType,
        enabled: input.enabled ?? true,
        limitEnabled: input.limitEnabled ?? false,
        invoiceRequired: input.invoiceRequired ?? false,
        sortOrder: input.sortOrder ?? 0
      }
    });
  }

  async update(id: string, input: Partial<ExpenseCategoryInput>) {
    const existing = await this.prisma.expenseCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("报销类别不存在");
    }

    return this.prisma.expenseCategory.update({
      where: { id },
      data: {
        name: input.name,
        sortOrder: input.sortOrder,
        enabled: input.enabled,
        invoiceRequired: input.invoiceRequired,
        limitEnabled: input.limitEnabled
      }
    });
  }
}
