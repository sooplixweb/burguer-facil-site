import type { UserRole } from "../enums/user-role.enum";

export interface UserResponseDto {
  id: string;
  phone: string;
  role: UserRole;
  name: string;
  email: string;
}
