"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar");
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al registrar";
      setError(message);
    } finally {
      setLoading(false);
    }
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
                  Crear cuenta
                </h2>
                <p className="mt-4 text-sm text-[#9CA3AF]">
                  Completa tus datos para registrarte como cliente.
                </p>
              </div>
            </div>

            <form className="flex flex-col gap-[20px]" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-[12px] border border-[#E8621A]/30 bg-[#E8621A]/10 px-4 py-3 text-sm text-[#FED7AA]">
                  {error}
                </div>
              )}

              {/* Nombre completo */}
              <div className="w-full flex flex-col items-center gap-[5px]">
                <span className="w-full max-w-[83%] text-left !text-[12px] !font-sans font-semibold uppercase tracking-widest text-[#9CA3AF] !pl-0">
                  Nombre completo *
                </span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tu nombre"
                  className="bt-input !p-[9px_16px] w-full max-w-[75%] mx-auto !text-[14px]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                  required
                />
              </div>

              {/* Correo electrónico */}
              <div className="w-full flex flex-col items-center gap-[5px]">
                <span className="w-full max-w-[83%] text-left !text-[12px] !font-sans font-semibold uppercase tracking-widest text-[#9CA3AF] !pl-0">
                  Correo electrónico *
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="usuario@correo.com"
                  className="bt-input !p-[9px_16px] w-full max-w-[75%] mx-auto !text-[14px]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                  required
                />
              </div>

              {/* Contraseña */}
              <div className="w-full flex flex-col items-center gap-[5px]">
                <span className="w-full max-w-[83%] text-left !text-[12px] !font-sans font-semibold uppercase tracking-widest text-[#9CA3AF] !pl-0">
                  Contraseña *
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="********"
                  className="bt-input !p-[9px_16px] w-full max-w-[75%] mx-auto !text-[14px]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                  required
                />
              </div>

              {/* Teléfono */}
              <div className="w-full flex flex-col items-center gap-[5px]">
                <span className="w-full max-w-[83%] text-left !text-[12px] !font-sans font-semibold uppercase tracking-widest text-[#9CA3AF] !pl-0">
                  Teléfono
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Ej. 2281234567"
                  className="bt-input !p-[9px_16px] w-full max-w-[75%] mx-auto !text-[14px]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                />
              </div>

              {/* Dirección */}
              <div className="w-full flex flex-col items-center gap-[5px]">
                <span className="w-full max-w-[83%] text-left !text-[12px] !font-sans font-semibold uppercase tracking-widest text-[#9CA3AF] !pl-0">
                  Dirección
                </span>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Calle y número"
                  className="bt-input !p-[9px_16px] w-full max-w-[75%] mx-auto !text-[14px]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                />
              </div>

              {/* Ciudad (arriba) */}
              <div className="w-full flex flex-col items-center gap-[5px]">
                <span className="w-full max-w-[83%] text-left !text-[12px] !font-sans font-semibold uppercase tracking-widest text-[#9CA3AF] !pl-0">
                  Ciudad
                </span>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Xalapa"
                  className="bt-input !p-[9px_16px] w-full max-w-[75%] mx-auto !text-[14px]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                />
              </div>

              {/* Código postal (abajo) */}
              <div className="w-full flex flex-col items-center gap-[5px]">
                <span className="w-full max-w-[83%] text-left !text-[12px] !font-sans font-semibold uppercase tracking-widest text-[#9CA3AF] !pl-0">
                  Código postal
                </span>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  placeholder="91000"
                  className="bt-input !p-[9px_16px] w-full max-w-[75%] mx-auto !text-[14px]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                />
              </div>

              {/* Botón registrar */}
              <div className="w-full flex justify-center mt-[5px]">
                <button
                  type="submit"
                  disabled={loading}
                  className="bt-button-primary bt-button-login w-full max-w-[83%] disabled:cursor-not-allowed disabled:opacity-60 uppercase font-extrabold"
                  style={{
                    fontFamily: "Arial, sans-serif",
                    transform: "scaleY(1.20)",
                    transformOrigin: "center center",
                    WebkitTextStroke: ".5px #ffffff",
                    textShadow: "0 0 1px #ffffff",
                  }}
                >
                  {loading ? "Registrando..." : "REGISTRARSE"}
                </button>
              </div>
            </form>

            {/* Enlace a login */}
            <div className="w-full flex justify-center mt-4">
              <p className="text-sm text-[#9CA3AF]">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-[#E8621A] hover:underline">
                  Inicia sesión
                </Link>
              </p>
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