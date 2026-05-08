import "./globals.css"; // Importante para aplicar el fondo oscuro y Tailwind [cite: 170, 434]
import Navbar from "../components/shared/Navbar"; // Importación desde el alias @
import { CartProvider } from "../lib/CartContext";

export const metadata = {
  title: 'Ben Tenison - Sistema Omnicanal',
  description: 'Gestión centralizada de inventario y punto de venta',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#0F0F0F] text-white">
        <CartProvider>
          <Navbar />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}