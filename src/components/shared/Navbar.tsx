"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { useState, useEffect } from "react";

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
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getNavItems = () => {
    if (loading || !user) return [{ name: "CATÁLOGO", href: "/" }];

    const items = [{ name: "CATÁLOGO", href: "/" }];

    // Todos los usuarios logueados ven Terminal e Inventario
    items.push(
      { name: "TERMINAL POS", href: "/terminal" },
      { name: "INVENTARIO", href: "/inventory" }
    );

    // Solo ADMIN y MANAGER ven Dashboard
    if (user.role === "ADMIN" || user.role === "MANAGER") {
      items.push({ name: "DASHBOARD", href: "/dashboard" });
    }

    // Solo ADMIN ve Usuarios
    if (user.role === "ADMIN") {
      items.push({ name: "USUARIOS", href: "/users" });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-[#0F0F0F] border-b border-[#333333] px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-white tracking-tighter">
          BEN <span className="text-[#E8621A]">TENISON</span>
        </div>
        
        <div className="flex gap-8 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-xs font-bold transition-colors tracking-widest",
                pathname === item.href 
                  ? "text-[#E8621A]" 
                  : "text-gray-300 hover:text-white"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center">
          {user ? (
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-3 rounded-md border border-[#333333] px-4 py-2 text-left transition-all hover:bg-[#1A1A1A] focus:outline-none"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="text-right border-r border-[#444] pr-3">
                  <div className="text-white font-mono text-xs font-bold uppercase">{user.name}</div>
                  <div className="text-[#E8621A] font-mono text-[10px] font-bold">{user.role}</div>
                </div>
                <div className="text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[#111111] border border-[#333333] rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#222] bg-[#161616]">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Sucursal Activa</p>
                    <p className="text-xs text-gray-200 font-mono">{user.storeName || "ADMINISTRACIÓN GLOBAL"}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    CERRAR SESIÓN
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2 bg-[#E8621A] hover:bg-[#FF7A2F] text-white font-bold rounded text-xs transition-colors tracking-widest"
            >
              LOGIN
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
