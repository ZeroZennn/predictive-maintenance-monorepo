export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  COPILOT_HUB: "/copilot-hub",
  SCHEDULER: "/scheduler",
  LOGS: "/logs",
  ADMIN: "/admin",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
