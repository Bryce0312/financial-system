import { Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";

import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        createdAt: "asc"
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles: user.roles.map((item) => item.role.code)
    }));
  }

  async resetPassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash
      }
    });

    return { success: true };
  }
}

