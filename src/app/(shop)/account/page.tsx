"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
}

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(currentDate)
    .toLowerCase();

  useEffect(() => {
    fetch("/api/auth/customer/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("No autenticado");
        return res.json();
      })
      .then((data) => setCustomer(data.customer || data))
      .catch(() => router.push("/login?returnUrl=/account"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/customer/logout", { method: "POST", credentials: "include" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060606]">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white">
          Cargando tu cuenta...
        </p>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible bg-[#060606]">
      <div className="mx-auto max-w-4xl">
        {/* Cabecera (original) */}
        <div className="flex w-full items-start justify-between mb-[15px]">
          <div className="flex flex-col">
            <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
              <Link href="/" className="hover:text-white transition-colors duration-200">
                Catálogo web
              </Link>
              <span>/</span>
              <span className="text-[#e8621a]">Mi cuenta</span>
            </nav>
            <h1
              className="text-[38px] font-[900] uppercase text-white leading-none tracking-tight"
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                transform: "scale(0.85, 1.15)",
                transformOrigin: "left center",
                WebkitTextStroke: "1.5px white",
                letterSpacing: "0.12em",
              }}
            >
              Mi cuenta
            </h1>
            <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Tarjeta centrada estilo login */}
        <div className="mx-auto max-w-[450px]">
          <div className="bt-panel rounded-2xl shadow-xl border border-[#333] overflow-hidden">
            <div className="w-[88%] mx-auto pt-6 pb-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                    Nombre completo
                  </p>
                  <p className="text-white font-sans">{customer.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                    Correo electrónico
                  </p>
                  <p className="text-white font-sans">{customer.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                    Teléfono
                  </p>
                  <p className="text-white font-sans">{customer.phone || "No registrado"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                    Dirección
                  </p>
                  <p className="text-white font-sans">{customer.address || "No registrada"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                    Ciudad
                  </p>
                  <p className="text-white font-sans">{customer.city || "No registrada"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                    Código postal
                  </p>
                  <p className="text-white font-sans">{customer.postalCode || "No registrado"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones con separaciones exactas */}
          <div className="flex flex-wrap gap-[5px] justify-center mt-[15px]">
            <Link
              href="/orders/history"
              className="bt-button-primary px-6 py-2 rounded-full text-xs tracking-[0.18em]"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Ver mis pedidos
            </Link>
            <button
              onClick={handleLogout}
              className="bt-button-ghost px-6 py-2 rounded-full text-xs tracking-[0.18em]"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}