export type ToastSeverity = "WARNING" | "CRITICAL" | "INFO" | "SUCCESS";

export interface ToastAlert {
  id: string;
  machine_id: string;
  severity: ToastSeverity;
  title: string;
  message: string;
  timestamp: string;
  isDismissed: boolean;
}
