"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      setError("Error al iniciar sesión. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0F0F0F] px-4 py-16">
      <div className="w-full max-w-md rounded-[32px] border border-gray-800 bg-[#1A1A1A] p-10 shadow-2xl shadow-black/40">
        <h1 className="text-4xl font-bebas uppercase tracking-[0.35em] text-white">Iniciar Sesión</h1>
        <p className="mt-3 text-sm text-gray-400">Accede al sistema con tu usuario asignado.</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <label className="block text-sm text-gray-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-gray-700 bg-[#0F0F0F] px-4 py-3 text-white outline-none focus:border-[#E8621A]"
              placeholder="usuario@correo.com"
              required
            />
          </label>

          <label className="block text-sm text-gray-300">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-gray-700 bg-[#0F0F0F] px-4 py-3 text-white outline-none focus:border-[#E8621A]"
              placeholder="********"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full rounded-full bg-[#E8621A] px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
