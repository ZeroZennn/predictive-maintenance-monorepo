"use client";

import { useState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="bg-lapis-surface rounded-2xl border border-lapis-border p-8 w-full max-w-md shadow-2xl">
      <h1 className="text-3xl font-bold text-lapis-neon text-center mb-2">
        Lapis AI
      </h1>
      <p className="text-lapis-muted text-center text-sm mb-8">
        Predictive Maintenance Dashboard
      </p>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-lapis-muted text-sm mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full bg-lapis-background border border-lapis-border rounded-lg px-4 py-2 text-lapis-text focus:outline-none focus:border-lapis-neon transition-colors"
            placeholder="admin@lapis-ai.com"
          />
        </div>

        <div>
          <label className="block text-lapis-muted text-sm mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full bg-lapis-background border border-lapis-border rounded-lg px-4 py-2 text-lapis-text focus:outline-none focus:border-lapis-neon transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-lapis-neon text-lapis-background font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
