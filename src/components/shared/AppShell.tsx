import type { ReactNode } from "react";
import Navbar from "./Navbar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    // Contenedor maestro: Fila estricta (izquierda a derecha), 100% de la pantalla, sin scroll global
    <div className="flex h-screen w-screen bg-[#0A0A0A] text-white overflow-hidden">
      
      {/* Columna Izquierda: Menú lateral con ancho fijo bloqueado */}
      <div className="w-[260px] shrink-0 h-full">
        <Navbar />
      </div>

      {/* Columna Derecha: Contenido principal, estirado al resto del espacio y con su propio scroll */}
      <main className="flex-1 h-full min-w-0 overflow-y-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
