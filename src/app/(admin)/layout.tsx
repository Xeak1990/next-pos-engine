// components/shared/AppShell.tsx
import type { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    /* IMPORTANTE: Aquí quitamos el <Sidebar /> y el contenedor flex extra.
       Dejamos solo el contenedor del contenido para que el Layout Global
       se encargue de la barra lateral.
    */
    <div className="w-full min-h-screen">
      {children}
    </div>
  );
}