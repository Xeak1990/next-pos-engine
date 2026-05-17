"use client";

import { useState } from "react";

export default function ProductsPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-[#94A3B8]">Catalogo</p>
            <h1 className="mt-3 text-5xl tracking-wider text-white">Productos</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#9CA3AF]">
              Vista preparada para la siguiente fase de alta y mantenimiento de productos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bt-button-primary px-6 py-3 text-xs"
          >
            + Nuevo Producto
          </button>
        </header>

        <section className="bt-panel grid gap-6 p-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[12px] border border-[#333333] bg-[#161616] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Estado del modulo</p>
            <h2 className="mt-3 text-3xl tracking-wider text-white">Estructura lista</h2>
            <p className="mt-4 text-sm text-[#D1D5DB]">
              La maquetacion ya respeta el shell de escritorio y deja el punto de entrada
              visible para el alta de productos.
            </p>
          </div>

          <div className="rounded-[12px] border border-[#333333] bg-[#161616] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Siguiente fase</p>
            <h2 className="mt-3 text-3xl tracking-wider text-white">Formulario de alta</h2>
            <p className="mt-4 text-sm text-[#D1D5DB]">
              El boton principal ya responde al clic y puede conectarse aqui cuando se agregue
              la logica de captura.
            </p>
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <div className="bt-panel w-full max-w-lg p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Modulo en desarrollo</p>
            <h2 className="mt-3 text-4xl tracking-wider text-white">Nuevo Producto</h2>
            <p className="mt-4 text-sm text-[#D1D5DB]">
              Funcionalidad en desarrollo para la siguiente fase.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="bt-button-primary px-6 py-3 text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
