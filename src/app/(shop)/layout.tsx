"use client";

import { CartProviderWeb } from "../../context/CartContextWeb";
// No importes Navbar (sidebar)

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProviderWeb>
      <div className="min-h-screen text-white m-[5px]" style={{ overflowY: "visible" }}>
        <main className="container mx-auto px-4 py-6 lg:px-8">{children}</main>
      </div>
    </CartProviderWeb>
  );
}