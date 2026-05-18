import type { ReactNode } from "react";
import Navbar from "./Navbar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    // Contenedor maestro: Fila estricta, 100% de la pantalla, sin scroll global
    <div className="flex h-screen w-screen bg-[#0A0A0A] text-white overflow-hidden select-none">
      
      {/* Columna Izquierda: Menú lateral estático con ancho optimizado */}
      <div className="w-[225px] shrink-0 h-full">
        <Navbar />
      </div>

      {/* Columna Derecha: Contenido de los módulos con scroll independiente */}
      <main className="flex-1 h-full min-w-0 overflow-y-auto px-6 py-5">
        {children}
      </main>
    </div>
  );
}