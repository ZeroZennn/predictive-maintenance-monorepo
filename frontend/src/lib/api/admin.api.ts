import apiClient from "./axios-instance";
import type { User } from "@/types";

export async function fetchUsers(): Promise<User[]> {
  const response = await apiClient.get<User[]>("/api/admin/users");
  return response.data;
}

export async function createUser(
  payload: Omit<User, "id" | "createdAt"> & { password: string }
): Promise<User> {
  const response = await apiClient.post<User>("/api/admin/users", payload);
  return response.data;
}

export async function updateUser(
  userId: string,
  payload: Partial<Omit<User, "id" | "createdAt">>
): Promise<User> {
  const response = await apiClient.patch<User>(
    "/api/admin/users/" + userId,
    payload
  );
  return response.data;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete("/api/admin/users/" + userId);
}

export async function uploadDocument(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ id: string; filename: string; status: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<{
    id: string;
    filename: string;
    status: string;
  }>("/api/admin/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percent);
      }
    },
  });
  return response.data;
}
