import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";

import { AuthResponse, LoginInput, RegisterInput, RoleCode } from "@financial-system/types";

import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const exists = await this.prisma.user.findUnique({ where: { username: input.username } });
    if (exists) {
      throw new BadRequestException("用户名已存在");
    }

    const employeeRole = await this.prisma.role.findUnique({ where: { code: RoleCode.EMPLOYEE } });
    if (!employeeRole) {
      throw new BadRequestException("默认员工角色不存在，请先执行 seed");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: input.username,
        passwordHash,
        realName: input.realName,
        email: input.email || null,
        phone: input.phone || null,
        roles: {
          create: {
            roleId: employeeRole.id
          }
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return this.issueTokens(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username: input.username },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException("用户名或密码错误");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("用户名或密码错误");
    }

    return this.issueTokens(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException("用户不存在");
    }

    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
      roles: user.roles.map((item) => item.role.code)
    };
  }

  private async issueTokens(user: {
    id: string;
    username: string;
    realName: string;
    email: string | null;
    phone: string | null;
    roles: Array<{ role: { code: RoleCode } }>;
  }): Promise<AuthResponse> {
    const roles = user.roles.map((item) => item.role.code);
    const payload = {
      sub: user.id,
      username: user.username,
      realName: user.realName,
      roles
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET", "access-secret"),
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRES_IN", "15m") as never
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET", "refresh-secret"),
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN", "7d") as never
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: await bcrypt.hash(refreshToken, 10)
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        roles
      }
    };
  }
}
