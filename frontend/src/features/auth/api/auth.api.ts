import { api } from "../../../lib/api";
import type { LoginResult, User } from "../../../types/auth";

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<LoginResult>("/auth/login", { email, password })
      .then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
};
