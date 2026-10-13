import axios from "axios";
import { env } from "../app/config/env";

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("apparelflow_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.error === "string") {
      return data.error;
    }

    return error.response
      ? `Request failed (${error.response.status})`
      : "Unable to connect to the server";
  }

  return "Something went wrong. Please try again.";
}
