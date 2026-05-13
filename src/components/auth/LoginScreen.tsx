"use client";

import { useState } from "react";

const demoUsers = [
  { label: "ADMIN", role: "ADMIN", email: "admin@bentenison.mx", password: "1234" },
  { label: "GERENTE", role: "MANAGER", email: "gerente@bentenison.mx", password: "1234" },
  { label: "CAJERO", role: "CASHIER", email: "cajero@bentenison.mx", password: "1234" },
];

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
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
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Correo o contrasena incorrectos.");
        return;
      }

      const role = data.user?.role as string | undefined;
      const destination = role === "CASHIER" ? "/terminal" : "/dashboard";
      window.location.href = destination;
    } catch (submitError) {
      console.error(submitError);
      setError("Error al iniciar sesion. Intenta de nuevo mas tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSelect = (demo: { email: string; password: string }) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
  };

  return (
    <main className="bt-grid-glow relative min-h-screen overflow-hidden px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,15,0.2),rgba(15,15,15,0.92))]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="bt-panel-blue relative overflow-hidden p-8 sm:p-10 lg:p-12">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8621A] to-transparent opacity-70" />

            <div className="inline-flex items-center gap-3 rounded-full border border-[#1A3A5F] bg-[#1A3A5F]/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C9D8EA]">
              <span className="h-2 w-2 rounded-full bg-[#2ECC71]" />
              Sistema Operativo Ben Tenison
            </div>

            <div className="mt-8">
              <p className="text-sm uppercase tracking-[0.38em] text-[#E8621A]">Acceso Centralizado</p>
              <h1 className="mt-5 text-6xl leading-none text-white sm:text-7xl">
                BEN <span className="text-[#E8621A]">TENISON</span>
              </h1>
            </div>
          </section>

          <section className="bt-panel relative overflow-hidden p-8 sm:p-10 lg:p-12">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1A3A5F] via-[#E8621A] to-[#1A3A5F]" />

            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.36em] text-[#94A3B8]">Acceso Seguro</p>
                <h2 className="mt-3 text-[28px] leading-none text-white">Iniciar Sesion</h2>
              </div>
              <span className="rounded-full border border-[#1A3A5F] bg-[#1A3A5F]/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D7E6F5]">
                Login
              </span>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-[12px] border border-[#E8621A]/30 bg-[#E8621A]/10 px-4 py-3 text-sm text-[#FED7AA]">
                  {error}
                </div>
              )}

              <label className="block space-y-2">
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D1D5DB]">
                  Correo Electronico
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@correo.com"
                  className="bt-input px-4 py-3"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D1D5DB]">
                  Contrasena
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className="bt-input px-4 py-3"
                  required
                />
              </label>

              <div className="flex flex-col gap-3 text-sm text-[#D1D5DB] sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border border-[#333333] bg-[#242424] text-[#E8621A]"
                  />
                  Recordarme
                </label>

                <button
                  type="button"
                  className="w-fit bg-transparent p-0 text-sm text-[#E8621A] shadow-none hover:text-[#F07330]"
                >
                  Olvidaste tu contrasena?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bt-button-primary w-full px-6 py-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Validando..." : "Entrar al Sistema"}
              </button>
            </form>

            <div className="mt-7 border-t border-[#333333] pt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-[#94A3B8]">Cuentas Demo</p>
                  <p className="mt-1 text-sm text-[#9CA3AF]">
                    Tarjetas clickeables para autocompletar el formulario.
                  </p>
                </div>
                <span className="rounded-full border border-[#333333] bg-[#111111] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-[#C9D8EA]">
                  Demo
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {demoUsers.map((demo) => (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => handleDemoSelect(demo)}
                    className="rounded-[12px] border border-[#333333] bg-[#111111] p-4 text-left hover:border-[#E8621A] hover:bg-[#181818]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[#94A3B8]">{demo.role}</p>
                    <p className="mt-3 text-lg font-semibold text-white">{demo.label}</p>
                    <p className="mt-2 break-all font-mono text-xs text-[#D1D5DB]">{demo.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
