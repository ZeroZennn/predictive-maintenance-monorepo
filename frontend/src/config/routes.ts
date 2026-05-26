export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  COPILOT_HUB: "/copilot-hub",
  SCHEDULER: "/scheduler",
  LOGS: "/logs",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_DOCUMENTS: "/admin/documents",
  ADMIN_LOGS: "/admin/logs",
  DEBUG: "/debug",
  SETTINGS: "/settings",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
