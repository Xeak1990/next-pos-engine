import "./globals.css";
import { CartProvider } from "../lib/CartContext";
import Navbar from "../components/shared/Navbar";

export const metadata = {
  title: "Ben Tenison - Sistema Omnicanal",
  description: "Gestión centralizada de inventario y punto de venta",
};

// RootLayout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full overflow-x-hidden"> 
      <body className="bg-[#0f0f0f] antialiased min-h-screen overflow-x-hidden">
        <CartProvider>
          {/* Contenedor relativo para que el Navbar fixed sepa dónde posicionarse */}
          <div className="relative flex min-h-screen w-full">
            
            {/* NAVBAR CONGELADO 
                'fixed' lo saca del flujo y lo pega a la pantalla.
                'h-screen' asegura que llegue hasta abajo.
            */}
            <aside className="fixed left-0 top-0 z-50 h-screen w-[260px] border-r border-[#1a1a1a] bg-[#121212]">
              <Navbar />
            </aside>

            {/* CONTENIDO DESPLAZABLE
                'ml-[260px]' reserva el espacio para que el Dashboard no se meta debajo del Navbar.
                'w-[calc(100%-260px)]' evita que el contenido se desborde a la derecha.
            */}
            <main className="ml-[260px] flex-1 w-[calc(100%-260px)] bg-[#060606] min-h-screen">
              {children}
            </main>

          </div>
        </CartProvider>
      </body>
    </html>
  );
}