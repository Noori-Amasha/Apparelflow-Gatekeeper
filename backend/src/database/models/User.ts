import { UserRole } from "../enums/UserRole";

export class User {
  id!: string;
  email!: string;
  password_hash!: string;
  role!: UserRole;
  full_name!: string;
  created_at!: Date;
}
