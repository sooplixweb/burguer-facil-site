import type { UserRole } from "../enums/user-role.enum";

export interface LoginResponseDto {
  token: string;
  expiresIn: number;
  role: UserRole;
}
