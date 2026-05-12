"use client";

import { useState } from "react";

const demoUsers = [
  { label: "ADMIN", role: "ADMIN", email: "admin@bentenison.mx", password: "1234" },
  { label: "GERENTE", role: "MANAGER", email: "gerente@bentenison.mx", password: "1234" },
  { label: "CAJERO", role: "CASHIER", email: "cajero@bentenison.mx", password: "1234" },
];

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
        setError(data.error || "Correo o contraseña incorrectos.");
        return;
      }

      const role = data.user?.role as string | undefined;
      const destination = role === "CASHIER" ? "/terminal" : "/dashboard";
      window.location.href = destination;
    } catch (error) {
      console.error(error);
      setError("Error al iniciar sesión. Intenta de nuevo más tarde.");
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
    <main className="relative min-h-screen overflow-hidden bg-[#0F0F0F] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(232,98,26,0.18),transparent_16%),radial-gradient(circle_at_bottom_right,_rgba(232,98,26,0.12),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:32px_32px] opacity-80" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-12 lg:flex-row lg:items-center lg:justify-between">
        <section className="mb-12 w-full max-w-xl rounded-[36px] border border-white/10 bg-[#111111]/80 p-10 shadow-[0_0_120px_rgba(232,98,26,0.12)] backdrop-blur-xl lg:mb-0">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.4em] text-[#E8621A]">Sistema Omnicanal</p>
            <h1 className="mt-6 text-5xl font-bebas uppercase tracking-[0.2em] text-white sm:text-6xl">
              BEN <span className="text-[#E8621A]">TENISON</span>
            </h1>
          </div>

          <p className="max-w-xl text-base leading-8 text-gray-300">
            Accede al sistema centralizado de Ben Tenison con seguridad en cada sesión.
            Usa una cuenta demo para explorar el dashboard o el punto de venta sin configuración previa.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {process.env.NODE_ENV === 'development' && demoUsers.map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => handleDemoSelect(demo)}
                className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:border-[#E8621A] hover:bg-[#1A1A1A]"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Demo</p>
                <p className="mt-3 text-lg font-semibold text-white">{demo.label}</p>
                <p className="mt-1 text-sm text-gray-400">{demo.email}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="w-full max-w-2xl rounded-[36px] border border-white/10 bg-[#1A1A1A]/95 p-10 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#111111]/70 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Acceso seguro</p>
              <h2 className="mt-2 text-3xl font-bebas uppercase tracking-[0.2em] text-white">Entrar al sistema</h2>
            </div>
            <div className="rounded-3xl bg-[#E8621A] px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-black">
              Rápido
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <label className="block">
              <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-[0.25em] text-gray-200">
                Correo Electrónico
              </span>
              <div className="flex items-center gap-3 rounded-3xl border border-gray-700 bg-[#0F0F0F] px-4 py-3 text-white focus-within:border-[#E8621A]">
                <span className="text-gray-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M4 4h16v16H4z" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-transparent text-white outline-none placeholder:text-gray-500"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-[0.25em] text-gray-200">
                Contraseña
              </span>
              <div className="flex items-center gap-3 rounded-3xl border border-gray-700 bg-[#0F0F0F] px-4 py-3 text-white focus-within:border-[#E8621A]">
                <span className="text-gray-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className="w-full bg-transparent text-white outline-none placeholder:text-gray-500"
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#E8621A] px-6 py-4 text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Validando..." : "Entrar al sistema"}
            </button>
          </form>

          <div className="mt-8 rounded-3xl border border-white/10 bg-[#111111]/70 p-5 text-sm text-gray-400">
            <p className="font-semibold text-white">Cuenta demo</p>
            <p className="mt-2 leading-7">
              Usa cualquiera de las tarjetas a la izquierda para autocompletar el formulario y probar el flujo de inicio de sesión.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
