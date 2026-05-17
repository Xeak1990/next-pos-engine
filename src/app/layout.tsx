import "./globals.css";
import { CartProvider } from "../lib/CartContext";

export const metadata = {
  title: "Ben Tenison - Sistema Omnicanal",
  description: "Gestión centralizada de inventario y punto de venta",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* Volvemos a activar Tailwind de forma segura usando la fuente sans y el fondo del sistema */}
      <body className="font-sans antialiased bg-[#0f0f0f] text-[#f5f5f5]">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
