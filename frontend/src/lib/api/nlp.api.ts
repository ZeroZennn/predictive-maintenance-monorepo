import apiClient from "./axios-instance";
import type { CopilotQueryPayload, CopilotResponse } from "@/types";

export async function queryCopilot(
  payload: CopilotQueryPayload
): Promise<CopilotResponse> {
  const response = await apiClient.post<CopilotResponse>(
    "/api/nlp/query",
    payload
  );
  return response.data;
}
