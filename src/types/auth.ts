export type UserRole = "user" | "coach" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}
