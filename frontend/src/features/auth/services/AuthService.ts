import { apiGet, apiPost } from "../../../shared/api/api.ts";

export interface Usuario {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export const AuthService = {
  register: (data: { username: string; email: string; password: string }) =>
    apiPost<{ user: Usuario }>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    apiPost<{ user: Usuario }>("/auth/login", data),

  me: () => apiGet<{ user: Usuario }>("/auth/me"),

  logout: () => apiPost<{ message: string }>("/auth/logout"),
};
