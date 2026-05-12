export type MessageRole = "USER" | "ASSISTANT";

export interface CitationSource {
  filename: string;
  page?: number;
  excerpt?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  sources?: CitationSource[];
  suggested_actions?: string[];
}

export interface CopilotQueryPayload {
  query: string;
  machine_id?: string;
  session_id: string;
}

export interface CopilotResponse {
  reply: string;
  sources: CitationSource[];
  suggested_actions: string[];
}
