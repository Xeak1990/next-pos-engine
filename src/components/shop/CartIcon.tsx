"use client";

import Link from "next/link";
import { useCartWeb } from "../../context/CartContextWeb";

export default function CartIcon() {
  const { totalItems } = useCartWeb();

  return (
    <Link href="/cart" className="relative">
      <svg
        className="h-6 w-6 text-white hover:text-[#E8621A] transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6H18M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
        />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#E8621A] text-[10px] font-bold text-white">
          {totalItems}
        </span>
      )}
    </Link>
  );
}