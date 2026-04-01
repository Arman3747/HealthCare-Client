import { UserRole } from "@/lib/auth-utils";

export interface UserInfo {
  name: string;
  email: string;
  role: UserRole;
}
