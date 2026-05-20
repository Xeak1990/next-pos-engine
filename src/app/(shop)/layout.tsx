import NavbarShop from "../../components/shop/NavbarShop";
import { CartProviderWeb } from "../../context/CartContextWeb";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProviderWeb>
      <div
        className="min-h-screen bg-[#0F0F0F] text-white"
        style={{ overflowY: "visible" }}
      >
        <NavbarShop />
        <main className="container mx-auto px-4 py-6 lg:px-8">{children}</main>
      </div>
    </CartProviderWeb>
  );
}
