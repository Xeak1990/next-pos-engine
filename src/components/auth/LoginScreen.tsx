"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const demoUsers = [
  { label: "ADMIN", role: "ADMIN", email: "admin@bentenison.mx", password: "1234" },
  { label: "GERENTE", role: "MANAGER", email: "gerente@bentenison.mx", password: "1234" },
  { label: "CAJERO", role: "CASHIER", email: "cajero@bentenison.mx", password: "1234" },
  { label: "CLIENTE", role: "CUSTOMER", email: "cliente@bentenison.mx", password: "cliente123" },
];

export default function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const isCustomer = email === "cliente@bentenison.mx" || email.includes("@bentenison.mx");
      let endpoint = "/api/auth/login";
      if (isCustomer) endpoint = "/api/auth/customer/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Correo o contraseña incorrectos.");
        return;
      }

      if (isCustomer) {
        window.location.href = returnUrl; // Forzar recarga completa
      } else {
        const role = data.user?.role as string | undefined;
        const destination = role === "CASHIER" ? "/terminal" : role === "CUSTOMER" ? "/" : "/dashboard";
        window.location.href = destination;
      }
    } catch (submitError) {
      console.error(submitError);
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
    <main className="bt-grid-glow relative min-h-screen overflow-hidden px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,15,0.2),rgba(15,15,15,0.92))]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-between">
        <div className="flex w-full flex-1 flex-col items-center pt-6">
          <header className="mb-8 text-center sm:mb-10">
            <h1
              className="text-5xl leading-none text-white sm:text-6xl font-extrabold uppercase"
              style={{
                transform: "scaleY(1.25)",
                transformOrigin: "center center",
                WebkitTextStroke: "0.5px currentColor",
                textShadow: "0 0 1px currentColor",
              }}
            >
              BEN <span className="text-[#E8621A]">TEN</span>ISON
            </h1>
            <p className="mt-4 text-base tracking-[0.18em] text-[#C9D8EA] sm:text-lg">
              Sistema de gestión omnicanal
            </p>
          </header>

          <section className="bt-panel-charcoal relative overflow-hidden p-6 sm:p-8 w-full max-w-[450px] min-h-[750px] flex flex-col justify-start">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1A3A5F] via-[#E8621A] to-[#1A3A5F]" />

            <div className="w-full max-w-[83%] mx-auto pt-[23px] mb-[15px] flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-[23px] leading-none text-white font-extrabold uppercase"
                  style={{
                    letterSpacing: "-0.01em",
                    transform: "scaleY(1.25)",
                    transformOrigin: "left center",
                    WebkitTextStroke: "1px #ffffff",
                    textShadow: "0 0 1px #ffffff",
                  }}
                >
                  Iniciar Sesión
                </h2>
                <p className="mt-4 text-sm text-[#9CA3AF]">
                  Ingresa tus credenciales para acceder al sistema.
                </p>
              </div>
            </div>

            <form className="flex flex-col gap-[20px]" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-[12px] border border-[#E8621A]/30 bg-[#E8621A]/10 px-4 py-3 text-sm text-[#FED7AA]">
                  {error}
                </div>
              )}

              {/* Campo correo */}
              <div className="w-full flex flex-col items-center gap-[5px]">
                <span className="w-full max-w-[83%] text-left !text-[12px] !font-sans font-semibold uppercase tracking-widest text-[#9CA3AF] !pl-0">
                  Correo Electrónico
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@correo.com"
                  className="bt-input !p-[9px_16px] w-full max-w-[75%] mx-auto !text-[14px]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                  required
                />
              </div>

              {/* Campo contraseña */}
              <div className="w-full flex flex-col items-center gap-[5px]">
                <span className="w-full max-w-[83%] text-left !text-[12px] !font-sans font-semibold uppercase tracking-widest !text-[#9CA3AF] !pl-0">
                  Contraseña
                </span>
                <div className="w-full flex flex-col gap-[5px]">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                    className="bt-input !p-[9px_16px] w-full max-w-[75%] mx-auto !text-[14px] block"
                    style={{ fontFamily: "Arial, sans-serif" }}
                    required
                  />
                  <div className="w-full max-w-[85%] mx-auto flex items-center justify-start pl-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none !text-[15px] !text-gray-400 !font-sans">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(event) => setShowPassword(event.target.checked)}
                        className="h-3.5 w-3.5 rounded border border-[#333333] bg-[#242424] text-[#E8621A] focus:ring-0 accent-[#E8621A] cursor-pointer"
                      />
                      Mostrar contraseña
                    </label>
                  </div>
                </div>
              </div>

              {/* Recordarme */}
              <div className="w-full max-w-[85%] mx-auto mt-[5px] flex flex-row items-center justify-between text-sm text-[#D1D5DB]">
                <label className="flex items-center gap-3 cursor-pointer select-none !font-sans !text-[15px] !text-gray-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border border-[#333333] bg-[#242424] text-[#E8621A] focus:ring-0 accent-[#E8621A] cursor-pointer"
                  />
                  Recordarme
                </label>
                <button
                  type="button"
                  className="w-fit bg-transparent p-0 !text-[15px] text-[#E8621A] shadow-none hover:text-[#F07330]"
                  style={{
                    fontFamily: "Arial, sans-serif",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                    padding: "0",
                    transform: "none",
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Botón entrar */}
              <div className="w-full flex justify-center mt-[5px]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bt-button-primary bt-button-login w-full max-w-[83%] disabled:cursor-not-allowed disabled:opacity-60 uppercase font-extrabold"
                  style={{
                    fontFamily: "Arial, sans-serif",
                    transform: "scaleY(1.20)",
                    transformOrigin: "center center",
                    WebkitTextStroke: ".5px #ffffff",
                    textShadow: "0 0 1px #ffffff",
                  }}
                >
                  {isSubmitting ? "Validando..." : "ENTRAR AL SISTEMA"}
                </button>
              </div>
            </form>

            {/* Enlace a registro */}
            <div className="w-full flex justify-center mt-4">
              <p className="text-sm text-[#9CA3AF]">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-[#E8621A] hover:underline">
                  Crear cuenta
                </Link>
              </p>
            </div>

            {/* Cuentas demo */}
            <div className="w-full max-w-[75%] mx-auto mt-[25px] rounded-[12px] border border-[#333333] bg-[#242424] p-[18px_20px]">
              <div className="mb-3.5 flex items-center justify-start">
                <p className="text-[10px] uppercase tracking-[0.18em] !text-[#9CA3AF] font-semibold !font-sans">
                  CUENTAS DE DEMOSTRACIÓN (CONTRASEÑA: 1234)
                </p>
              </div>
              <div className="flex flex-col gap-[8px] w-full">
                {demoUsers.map((demo) => (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => handleDemoSelect(demo)}
                    className="w-full rounded-[6px] border border-[#1f1f1f] bg-[#141414] p-[12px_16px] flex flex-row items-center justify-between hover:border-[#E8621A] hover:bg-[#1a1a1a] transition-all duration-200"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      minHeight: "auto",
                      transform: "none",
                    }}
                  >
                    <span className="font-mono text-[13px] text-[#9CA3AF] tracking-wide text-left">
                      {demo.email}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#E8621A] text-right font-bebas">
                      {demo.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-8 pb-2 text-center text-sm text-[#94A3B8]">
          Ben Tenison &copy; 2026 - ISC Programación Web - ITSX
        </footer>
      </div>
    </main>
  );
}