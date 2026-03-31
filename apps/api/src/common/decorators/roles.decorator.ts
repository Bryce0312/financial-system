import { SetMetadata } from "@nestjs/common";

import { RoleCode } from "@financial-system/types";

export const ROLES_KEY = "roles";
export const Roles = (...roles: RoleCode[]) => SetMetadata(ROLES_KEY, roles);


