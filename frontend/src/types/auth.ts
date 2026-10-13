export type Role =
  | "cutting_supervisor"
  | "cutting_verifier"
  | "sewing_supervisor";

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
};

export type LoginResult = {
  token: string;
  user: User;
};

export const roleLabel: Record<Role, string> = {
  cutting_supervisor: "Cutting Supervisor",
  cutting_verifier: "Cutting Verifier",
  sewing_supervisor: "Sewing Supervisor",
};
