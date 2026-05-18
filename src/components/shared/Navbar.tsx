"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactElement, type SVGProps } from "react";
import { cn } from "../../lib/utils";

type UserRole = "ADMIN" | "MANAGER" | "CASHIER";

type UserData = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  storeId: string | null;
  storeName?: string | null;
};

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement;

type NavItem = {
  name: string;
  href: string;
  icon: IconComponent;
  roles: UserRole[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const ALL_ROLES: UserRole[] = ["ADMIN", "MANAGER", "CASHIER"];

/* =========================================
   ICONOS SVG (Mismos trazos y grosores)
   ========================================= */
function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="9"
        rx="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="5"
        rx="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="14"
        y="12"
        width="7"
        height="9"
        rx="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="3"
        y="16"
        width="7"
        height="5"
        rx="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PosIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
      <path
        d="M3 5h2l1.68 8.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L21 5H5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CatalogIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        d="M4 6h16M4 12h16M4 18h16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="3.27 6.96 12 12.01 20.73 6.96"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="22.08"
        x2="12"
        y2="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InventoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="9"
        cy="7"
        r="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReportsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="14 2 14 8 20 8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="16"
        y1="13"
        x2="8"
        y2="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="16"
        y1="17"
        x2="8"
        y2="17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="10 9 9 9 8 9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PowerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

/* =========================================
   ESTRUCTURA DE NAVEGACIÓN
   ========================================= */
const navigationSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: DashboardIcon,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        name: "Punto de Venta",
        href: "/terminal",
        icon: PosIcon,
        roles: ALL_ROLES,
      },
      {
        name: "Catálogo Web",
        href: "/",
        icon: CatalogIcon,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "Operaciones",
    items: [
      {
        name: "Productos",
        href: "/products",
        icon: ProductsIcon,
        roles: ["ADMIN"],
      },
      {
        name: "Inventario",
        href: "/inventory",
        icon: InventoryIcon,
        roles: ALL_ROLES,
      },
      // Añadida la sección de sucursales del mockup
      {
        name: "Sucursales",
        href: "/stores",
        icon: StoreIcon,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "Administración",
    items: [
      { name: "Usuarios", href: "/users", icon: UsersIcon, roles: ["ADMIN"] },
      {
        name: "Reportes",
        href: "/reports",
        icon: ReportsIcon,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getRoleLabel(role: UserRole) {
  if (role === "ADMIN") return "Admin";
  if (role === "MANAGER") return "Manager";
  return "Caja";
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchUser() {
      setLoading(true);
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          setUser(null);
          return;
        }
        const data = (await response.json()) as UserData;
        setUser(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setUser(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    fetchUser();
    return () => controller.abort();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const visibleSections = user
    ? navigationSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.roles.includes(user.role)),
        }))
        .filter((section) => section.items.length > 0)
    : [];

  const userInitials =
    user?.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AG";

  /* =========================================
     RENDERIZADO DE SECCIONES
     ========================================= */
  const renderSection = (section: NavSection, compact = false) => (
    <section key={section.title} className="mb-4">
      <p
        className={cn(
          "inline-flex h-8 min-h-[32px] items-center rounded-full px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]",
          compact && "px-3",
        )}
      >
        {section.title}
      </p>

      {/* Espaciado limpio entre botones */}
      <div className="mt-3 flex flex-col gap-3">
        {section.items.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // Bordes suavizados rectangulares (rounded-lg)
                "group relative flex items-center gap-3 overflow-hidden rounded-lg pl-10 pr-4 py-3 min-h-[48px] text-[14px] font-medium transition-all duration-150",
                compact && "px-3 py-2 text-sm",
                isActive
                  ? // Estado activo: Fondo sutil, texto naranja e indicador lateral (calcado al mockup)
                    "bg-[#E8621A]/10 text-[#E8621A] before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-[#E8621A]"
                  : // Estado inactivo: Gris tenue y hover elegante
                    "text- hover:bg-[#1A1A1A] hover:text-white",
              )}
            >
              <Icon
                className={cn(
                  "h-[20px] w-[20px] shrink-0 transition-colors",
                  isActive
                    ? "text-[#E8621A]"
                    : "text-[#70757D] group-hover:text-white",
                )}
              />
              <span
                className={cn(
                  "transition-all duration-200 transform",
                  isActive
                    ? "text-[#E8621A] scale-105 font-semibold"
                    : "text-[#9CA3AF] group-hover:text-[#E8621A] group-hover:scale-105",
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );

  /* =========================================
     FOOTER / PERFIL (Calcado al mockup)
     ========================================= */
  const accountCard = user ? (
    <div className="flex items-center justify-between rounded-[24px] bg-[#181818] p-2">
      <div className="flex min-w-0 items-center gap-2">
        {/* Avatar circular */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8621A]/15 border border-[#E8621A]/25 text-sm font-bold text-[#E8621A]">
          {" "}
          {userInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white leading-tight">
            {user.name}
          </p>
          <p className="mt-0.5 text-[9px] uppercase tracking-widest text-[#6B7280]">
            {getRoleLabel(user.role)}
          </p>
        </div>
      </div>
      {/* Botón de Logout */}
      <button
        type="button"
        onClick={handleLogout}
        className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#181818] border border-[#222222] text-[#9CA3AF] transition-colors"
        aria-label="Cerrar sesión"
      >
        <PowerIcon className="h-[18px] w-[18px]" />
      </button>
    </div>
  ) : (
    <Link
      href="/login"
      className="bt-button-primary flex w-full justify-center px-5 py-3 text-xs rounded-lg"
    >
      Ingresar
    </Link>
  );

  const loadingState = (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div key={sectionIndex}>
          <div className="h-2 w-20 rounded bg-white/5 ml-4" />
          <div className="mt-3 flex flex-col gap-1.5">
            {Array.from({ length: 2 }).map((__, itemIndex) => (
              <div
                key={itemIndex}
                className="h-10 rounded-lg bg-white/[0.02]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <aside className="flex h-full w-full flex-col border-r border-[#1C1C1C] bg-[#121212]">
      {/* Cabecera / Logo */}
      <div className="shrink-0 border-b border-[#1C1C1C] px-5 py-4">
        <Link href="/" className="block">
          <p className="font-bebas font-black text-[1.125rem] uppercase leading-none tracking-[0.06em] text-white">
            BEN <span className="text-[#E8621A]">TEN</span>ISON
          </p>
          <p className="-mt-1 text-[10px] uppercase tracking-[0.18em] text-[#6B7280]">
            Sistema omnicanal
          </p>
        </Link>
      </div>

      {/* Cuerpo del Menú con Scroll independiente */}
      <div className="flex-1 overflow-y-auto px-2 py-4 min-h-0">
        {loading ? (
          loadingState
        ) : (
          <div className="flex flex-col gap-5">
            {visibleSections.map((section) => renderSection(section))}
          </div>
        )}
      </div>

      {/* Footer (Tarjeta de Usuario) fijado abajo */}
      <div className="shrink-0 border-t border-[#1C1C1C] p-3">
        {!loading && accountCard}
      </div>
    </aside>
  );
}
