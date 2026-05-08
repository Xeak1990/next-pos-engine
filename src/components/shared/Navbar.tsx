"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "CATÁLOGO", href: "/" },
    { name: "TERMINAL POS", href: "/terminal" },
    { name: "INVENTARIO", href: "/inventory" },
    { name: "DASHBOARD", href: "/dashboard" },
  ];

  return (
    <nav className="bg-[#1A3A5F] border-b border-gray-800 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-white tracking-tighter">
          BEN <span className="text-[#E8621A]">TENISON</span>
        </div>
        
        <div className="flex gap-8">
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
      </div>
    </nav>
  );
}