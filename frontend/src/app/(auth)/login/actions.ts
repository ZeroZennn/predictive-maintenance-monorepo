"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      // cache: 'no-store' is default for POST in fetch
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message || "Invalid credentials" };
    }

    const token = data.data.token;

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("lapis_token", token, {
      httpOnly: false, // Accessible from client if needed, but safer as true. Middleware can read it either way.
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

  } catch (error) {
    console.error("Login action error:", error);
    return { error: "Failed to connect to authentication server." };
  }

  redirect("/");
}
