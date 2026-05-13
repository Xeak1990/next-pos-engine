"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

type UserData = {
  userId: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
  storeId: string | null;
  storeName?: string | null;
};

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setShowDropdown(false);

      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [pathname]);

  const hiddenPaths = ["/login", "/Login"];
  if (pathname && hiddenPaths.includes(pathname)) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getNavItems = () => {
    if (loading || !user) {
      return [{ name: "CATALOGO", href: "/" }];
    }

    const items = [
      { name: "CATALOGO", href: "/" },
      { name: "TERMINAL POS", href: "/terminal" },
      { name: "INVENTARIO", href: "/inventory" },
    ];

    if (user.role === "ADMIN" || user.role === "MANAGER") {
      items.push(
        { name: "DASHBOARD", href: "/dashboard" },
        { name: "REPORTES", href: "/reports" },
      );
    }

    if (user.role === "ADMIN") {
      items.push({ name: "USUARIOS", href: "/users" });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1A3A5F]/45 bg-[#0F0F0F]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-[12px] border border-[#1A3A5F] bg-[#1A3A5F]/18 px-3 py-2">
            <p className="font-bebas text-3xl leading-none text-white">
              BEN <span className="text-[#E8621A]">TENISON</span>
            </p>
          </div>
          <div className="hidden text-xs uppercase tracking-[0.28em] text-[#94A3B8] sm:block">
            Sistema Omnicanal
          </div>
        </Link>

        <div className="order-3 w-full lg:order-none lg:w-auto lg:flex-1 lg:justify-center">
          <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-[#1A3A5F] bg-[#1A3A5F]/12 p-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-[8px] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]",
                    isActive
                      ? "bg-[#E8621A] text-white shadow-[0_8px_24px_rgba(232,98,26,0.22)]"
                      : "text-[#CBD5E1] hover:bg-white/5 hover:text-white",
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown((current) => !current)}
                className="flex items-center gap-3 border border-[#333333] bg-[#1A1A1A] px-4 py-2 text-left hover:border-[#1A3A5F] hover:bg-[#242424]"
              >
                <div className="text-right">
                  <p className="font-mono text-xs font-semibold uppercase text-white">{user.name}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[#E8621A]">
                    {user.role}
                  </p>
                </div>
                <span className="rounded-full border border-[#1A3A5F] bg-[#1A3A5F]/18 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D7E6F5]">
                </span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-[12px] border border-[#333333] bg-[#111111] shadow-2xl shadow-black/50">
                  <div className="border-b border-[#333333] bg-[#1A3A5F]/18 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#94A3B8]">
                      Sucursal Activa
                    </p>
                    <p className="mt-2 font-mono text-sm text-white">
                      {user.storeName || "Administracion Global"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#FCA5A5] hover:bg-[#242424]"
                  >
                    <span className="font-mono text-xs text-[#E8621A]">Cerrar sesion</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bt-button-primary inline-flex items-center px-5 py-3 text-xs"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
