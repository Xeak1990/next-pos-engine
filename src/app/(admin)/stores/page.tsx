"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

function formatLowercaseDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(date)
    .toLowerCase();
}

const now = new Date();

type Store = {
  id: string;
  name: string;
  location: string;
  _count?: { inventory: number; users: number };
};

function StoreModal({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      style={{ top: 0, right: 0, bottom: 0, left: 0 }}
    >
      {children}
    </div>,
    document.body,
  );
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [form, setForm] = useState({ name: "", location: "" });
  const router = useRouter();

  const MODAL_WIDTH_PX = 500;

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch("/api/stores");
        if (res.ok) {
          const data = await res.json();
          setStores(data);
        } else if (res.status === 403) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingStore ? `/api/stores/${editingStore.id}` : "/api/stores";
    const method = editingStore ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const refreshRes = await fetch("/api/stores");
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setStores(data);
      }
      setModalOpen(false);
      setEditingStore(null);
      setForm({ name: "", location: "" });
    } else {
      alert("Error al guardar");
    }
  };

  const handleDisable = async (id: string) => {
    if (!confirm("¿Deshabilitar esta sucursal? Se ocultará del listado.")) return;
    alert("Funcionalidad en desarrollo: deshabilitar sucursal");
  };

  if (loading) return <div className="text-white p-6">Cargando...</div>;

  return (
    <div className="w-full min-h-screen bg-[#060606] px-6 py-8 text-white overflow-y-visible">
      {/* Cabecera */}
      <div className="flex flex-col">
        <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
          <Link href="/" className="hover:text-white transition-colors duration-200">
            Operaciones
          </Link>
          <span>/</span>
          <span className="text-[#e8621a]">Sucursales</span>
        </nav>
        <h1
          className="text-[38px] font-[900] uppercase text-white leading-none tracking-tight"
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            transform: "scale(0.85, 1.15)",
            transformOrigin: "left center",
            WebkitTextStroke: "1.5px white",
            letterSpacing: "0.12em",
          }}
        >
          Sucursales
        </h1>
        <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
          {formatLowercaseDate(now)}
        </p>
      </div>

      {/* Botón Nueva sucursal */}
      <div className="flex justify-end mt-4 mb-[15px]">
        <button
          onClick={() => {
            setEditingStore(null);
            setForm({ name: "", location: "" });
            setModalOpen(true);
          }}
          className="bt-button-primary px-6 py-2 text-xs whitespace-nowrap"
          style={{
            fontFamily: "Arial, sans-serif",
            padding: "7px 12px !important",
            minHeight: "auto !important",
          }}
        >
          + Nueva sucursal
        </button>
      </div>

      {/* Grid de sucursales */}
      <div className="grid gap-[5px] md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <article
            key={store.id}
            className="bt-panel rounded-[24px] bg-[#151515] p-[5px] flex flex-col transition-all hover:border-[#E8621A] hover:shadow-md"
          >
            {/* Fila superior con título y botones alineados verticalmente */}
            <div className="flex justify-between items-center gap-2">
              <h2 className="text-xl font-semibold text-white leading-tight">{store.name}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingStore(store);
                    setForm({ name: store.name, location: store.location });
                    setModalOpen(true);
                  }}
                  className="bt-button-ghost px-4 py-2 text-xs rounded-[12px] border border-[#333333] text-[#D1D5DB] hover:bg-[#333333]/20 transition-colors duration-200"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDisable(store.id)}
                  className="bt-button-ghost px-4 py-2 text-xs rounded-[12px] border border-[#333333] text-[#D1D5DB] hover:bg-[#333333]/20 transition-colors duration-200"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Deshabilitar
                </button>
              </div>
            </div>
            <p className="text-sm text-[#9CA3AF]">{store.location}</p>
            <div className="mt-4 flex justify-between text-sm text-[#CBD5E1]">
              <span>📦 Inventarios: {store._count?.inventory ?? 0}</span>
              <span>👥 Usuarios: {store._count?.users ?? 0}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Modal (sin cambios) */}
      {modalOpen && (
        <StoreModal>
          <div
            role="dialog"
            aria-modal="true"
            className="custom-scrollbar overflow-y-auto rounded-[24px] bg-[#1A1A1A] shadow-xl max-h-[90vh] border border-gray-600"
            style={{ width: `${MODAL_WIDTH_PX}px` }}
          >
            <div className="w-[88%] mx-auto px-[20px] py-[15px] space-y-[8px]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]" style={{ fontFamily: "Arial, sans-serif" }}>
                    {editingStore ? "Editar sucursal" : "Nueva sucursal"}
                  </p>
                  <h2 className="mt-1 text-4xl text-white" style={{ fontFamily: "Arial, sans-serif" }}>
                    {editingStore ? "Editar Sucursal" : "Crear Sucursal"}
                  </h2>
                  <p className="mt-1 text-sm text-[#9CA3AF]" style={{ fontFamily: "Arial, sans-serif" }}>
                    {editingStore
                      ? "Modifica los datos de la sucursal."
                      : "Ingresa el nombre y ubicación del nuevo punto de venta."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bt-button-ghost px-4 py-2 text-xs"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Cerrar
                </button>
              </div>

              <form className="space-y-[8px]" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm text-[#D1D5DB] mb-[5px]" style={{ fontFamily: "Arial, sans-serif" }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bt-input w-full px-4 py-3"
                    placeholder="Ej. Centro Xalapa"
                    required
                    style={{ fontFamily: "Arial, sans-serif" }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#D1D5DB] mb-[5px]" style={{ fontFamily: "Arial, sans-serif" }}>
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="bt-input w-full px-4 py-3"
                    placeholder="Ej. Centro Histórico, Xalapa, Ver."
                    required
                    style={{ fontFamily: "Arial, sans-serif" }}
                  />
                </div>

                <div className="flex flex-col gap-[8px] pt-[8px] sm:flex-row sm:justify-end mt-[8px]">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="bt-button-ghost px-6 py-3 text-xs"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bt-button-primary px-6 py-3 text-xs"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    {editingStore ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </StoreModal>
      )}
    </div>
  );
} 