"use client";

import "./globals.css";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { CartProvider } from "../lib/CartContext";
import Navbar from "../components/shared/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; role: "ADMIN" | "MANAGER" | "CASHIER" } | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  // Solo rutas realmente públicas (sin autenticación)
  const isPublicRoute = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    isMounted.current = true;
    const controller = new AbortController();

    const fetchUser = async () => {
      if (isPublicRoute) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          signal: controller.signal,
        });
        if (!isMounted.current) return;
        if (res.ok) {
          const data = await res.json();
          const userData = data.user || data.customer || data;
          const role = userData?.role;
          if (role === "ADMIN" || role === "MANAGER" || role === "CASHIER") {
            setUser({ name: userData.name, email: userData.email, role });
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError" && isMounted.current) {
          setUser(null);
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      controller.abort();
      isMounted.current = false;
    };
  }, [isPublicRoute]);

  if (loading) {
    return (
      <html lang="es" className="h-full overflow-x-hidden">
        <body className="bg-[#0f0f0f] antialiased min-h-screen overflow-x-hidden" />
      </html>
    );
  }

  // Mostrar sidebar solo si hay un empleado autenticado (no cliente)
  const showSidebar = !isPublicRoute && user !== null;

  return (
    <html lang="es" className="h-full overflow-x-hidden">
      <body className="bg-[#0f0f0f] antialiased min-h-screen overflow-x-hidden">
        <CartProvider>
          {showSidebar ? (
            <div className="relative flex min-h-screen w-full">
              <aside className="fixed left-0 top-0 z-50 h-screen w-[260px] border-r border-[#1a1a1a] bg-[#121212]">
                <Navbar user={user} />
              </aside>
              <main className="ml-[260px] flex-1 w-[calc(100%-260px)] bg-[#060606] min-h-screen">
                {children}
              </main>
            </div>
          ) : (
            <>{children}</>
          )}
        </CartProvider>
      </body>
    </html>
  );
}