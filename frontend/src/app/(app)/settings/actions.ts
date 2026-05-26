"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/config";

export async function logoutAction() {
  const cookieStore = await cookies();
  
  // Optionally call backend logout endpoint to invalidate token or log event
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
  const token = cookieStore.get("lapis_token")?.value;

  if (token) {
    try {
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
    } catch (error) {
      console.error("Backend logout error (ignoring):", error);
    }
  }

  // Always delete cookie on the client side
  cookieStore.delete("lapis_token");
  
  redirect(ROUTES.LOGIN);
}
