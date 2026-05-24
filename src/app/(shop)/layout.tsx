import { CartProviderWeb } from "../../context/CartContextWeb";
// Elimina la importación de NavbarShop
// import NavbarShop from "../../components/shop/NavbarShop";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProviderWeb>
      <div
        className="min-h-screen text-white m-[5px]"
        style={{ overflowY: "visible" }}
      >
        {/* Eliminado: <NavbarShop /> */}
        <main className="container mx-auto px-4 py-6 lg:px-8">{children}</main>
      </div>
    </CartProviderWeb>
  );
}