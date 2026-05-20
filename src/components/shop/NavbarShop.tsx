"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import CartIcon from "./CartIcon";

export default function NavbarShop() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222222] bg-[#0A0A0A]/90 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-bebas text-2xl font-black tracking-tight text-white">
            BT
          </span>
          <span className="text-[8px] uppercase tracking-[0.3em] text-[#6B7280]">
            TENISON
          </span>
        </Link>

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

        <div className="flex items-center gap-4">
          <Link
            href="/account"
            className="hidden md:flex items-center gap-1 text-sm font-medium text-[#D1D5DB] hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>Mi cuenta</span>
          </Link>
          <CartIcon />
        </div>
      </div>

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
