import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { AuthenticatedUser } from "@/common/interfaces/authenticated-user.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_ACCESS_SECRET", "access-secret")
    });
  }

  validate(payload: { sub: string; username: string; realName: string; roles: string[] }): AuthenticatedUser {
    return {
      id: payload.sub,
      username: payload.username,
      realName: payload.realName,
      roles: payload.roles as AuthenticatedUser["roles"]
    };
  }
}

