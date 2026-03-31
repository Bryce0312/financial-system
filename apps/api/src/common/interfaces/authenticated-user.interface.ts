import { RoleCode } from "@financial-system/types";

export interface AuthenticatedUser {
  id: string;
  username: string;
  realName: string;
  roles: RoleCode[];
}


