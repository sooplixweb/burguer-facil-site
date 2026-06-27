import { UserRole } from '../enums/user-role.enum';

export interface UserRequestDto {
  name: string;
  phone:string;
  role: UserRole;
  email: string;
  password: string;
}
