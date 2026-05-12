import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getAuthPayloadFromCookies } from "../../../lib/token-utils";

export default async function TerminalPage() {
  const auth = await getAuthPayloadFromCookies(await cookies());
  if (!auth) {
    redirect("/Login");
  }

  const store = auth.storeId
    ? await prisma.store.findUnique({ where: { id: auth.storeId } })
    : null;

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-gray-800 bg-[#1A1A1A] p-10 shadow-2xl shadow-black/40">
        <header className="mb-8">
          <h1 className="text-4xl font-bebas uppercase tracking-[0.35em] text-white">Terminal POS</h1>
          <p className="mt-2 text-gray-400">
            {store
              ? `El sistema está bloqueado en la sucursal asignada: ${store.name} (${store.location}).`
              : "No se ha asignado una sucursal a este usuario. Acceso general al POS."}
          </p>
        </header>

        <div className="rounded-3xl border border-gray-700 bg-[#0F0F0F] p-8 text-gray-300">
          <p className="mb-4 text-lg text-white">Bienvenido al punto de venta.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#131313] p-5">
              <h2 className="text-sm uppercase tracking-[0.25em] text-gray-500">Terminal</h2>
              <p className="mt-3 text-xl font-semibold text-[#E8621A]">OPERATIVA</p>
            </div>
            <div className="rounded-2xl bg-[#131313] p-5">
              <h2 className="text-sm uppercase tracking-[0.25em] text-gray-500">Estado</h2>
              <p className="mt-3 text-xl font-semibold text-green-400">ACTIVO</p>
            </div>
            <div className="rounded-2xl bg-[#131313] p-5 sm:col-span-2">
              <h2 className="text-sm uppercase tracking-[0.25em] text-gray-500">Sucursal asignada</h2>
              <p className="mt-3 text-xl font-semibold text-white">
                {store ? `${store.name} · ${store.location}` : "No aplica"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
