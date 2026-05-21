"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import CartIcon from "./CartIcon";

export default function NavbarShop() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [customer, setCustomer] = useState<{ name: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCustomer = async () => {
      try {
        // Asegúrate de usar la ruta correcta: customer o costumer
        const res = await fetch("/api/auth/customer/me");
        if (res.ok && isMounted) {
          const data = await res.json();
          // AHORA: data ES EL OBJETO DEL USUARIO (no data.customer)
          setCustomer(data || null);
        } else if (isMounted) {
          setCustomer(null);
        }
      } catch {
        if (isMounted) setCustomer(null);
      }
    };
    fetchCustomer();
    return () => {
      isMounted = false;
    };
  }, [pathname]); // se ejecuta al montar y cada vez que cambia la ruta

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/customer/logout", { method: "POST" });
    setCustomer(null);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222222] bg-[#0A0A0A]/90 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-bebas text-2xl font-black tracking-tight text-white">
            BT
          </span>
          <span className="text-[8px] uppercase tracking-[0.3em] text-[#6B7280]">
            TENISON
          </span>
        </Link>

        {/* Buscador desktop */}
        <form
          onSubmit={handleSearch}
          className="hidden md:block flex-1 max-w-md mx-6"
        >
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full rounded-full border border-[#333333] bg-[#111111] py-2 pl-10 pr-4 text-sm text-white placeholder:text-[#6B7280] focus:border-[#E8621A] focus:outline-none"
            />
            <svg
              width="16"
              height="16"
              className="absolute left-3 top-2.5 text-[#6B7280]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </form>

        {/* Iconos y dropdown */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1A] text-sm font-medium text-white transition-colors hover:bg-[#E8621A] focus:outline-none"
              aria-label="Menú de usuario"
            >
              {customer ? (
                <span className="uppercase">
                  {customer.name?.charAt(0) || "U"}
                </span>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </button>
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-[#333] bg-[#1A1A1A] py-1 shadow-lg z-50">
                  {customer ? (
                    <>
                      <div className="px-4 py-2 text-sm text-white border-b border-[#333]">
                        Hola, {customer.name?.split(" ")[0] || "Usuario"}
                      </div>
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-[#D1D5DB] hover:bg-[#2A2A2A] hover:text-white"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Mi cuenta
                      </Link>
                      <Link
                        href="/orders/history"
                        className="block px-4 py-2 text-sm text-[#D1D5DB] hover:bg-[#2A2A2A] hover:text-white"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Mis pedidos
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-[#D1D5DB] hover:bg-[#2A2A2A] hover:text-white"
                      >
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-sm text-[#D1D5DB] hover:bg-[#2A2A2A] hover:text-white"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Iniciar sesión
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
          <CartIcon />
        </div>
      </div>

      {/* Buscador móvil */}
      <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full rounded-full border border-[#333333] bg-[#111111] py-2 pl-10 pr-4 text-sm text-white placeholder:text-[#6B7280] focus:border-[#E8621A] focus:outline-none"
          />
          <svg
            width="16"
            height="16"
            className="absolute left-3 top-2.5 text-[#6B7280]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </form>
    </header>
  );
}
