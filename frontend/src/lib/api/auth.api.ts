import apiClient from "./axios-instance";
import type { LoginPayload, LoginResponse } from "@/types";

export async function loginUser(
  payload: LoginPayload
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/api/auth/login",
    payload
  );
  return response.data;
}

export async function logoutUser(): Promise<void> {
  await apiClient.post("/api/auth/logout");
}
