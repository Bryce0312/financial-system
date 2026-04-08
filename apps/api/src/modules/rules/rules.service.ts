import { Injectable, NotFoundException } from "@nestjs/common";

import { RuleInput } from "@financial-system/types";

import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.limitRule.findMany({
      orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
      include: {
        expenseCategory: true
      }
    });
  }

  create(input: RuleInput) {
    return this.prisma.limitRule.create({
      data: {
        name: input.name,
        expenseCategoryId: input.expenseCategoryId,
        enabled: input.enabled ?? true,
        limitAmount: input.limitAmount,
        effectiveAt: new Date(input.effectiveAt),
        description: input.description || ""
      }
    });
  }

  async update(id: string, input: Partial<RuleInput>) {
    const existing = await this.prisma.limitRule.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("规则不存在");
    }

    return this.prisma.limitRule.update({
      where: { id },
      data: {
        name: input.name,
        enabled: input.enabled,
        limitAmount: input.limitAmount,
        description: input.description,
        effectiveAt: input.effectiveAt ? new Date(input.effectiveAt) : undefined
      }
    });
  }

  async findActiveRule(expenseCategoryId: string, at: Date) {
    return this.prisma.limitRule.findFirst({
      where: {
        expenseCategoryId,
        enabled: true,
        effectiveAt: {
          lte: at
        }
      },
      orderBy: {
        effectiveAt: "desc"
      }
    });
  }
}
