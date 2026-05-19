"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Store = {
  id: string;
  name: string;
  location: string;
  _count?: { inventory: number; users: number };
};

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [form, setForm] = useState({ name: "", location: "" });
  const router = useRouter();

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // Refrescar la lista
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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta sucursal? Se perderán inventarios y usuarios asociados.")) return;
    const res = await fetch(`/api/stores/${id}`, { method: "DELETE" });
    if (res.ok) {
      const refreshRes = await fetch("/api/stores");
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setStores(data);
      }
    } else {
      alert("Error al eliminar");
    }
  };

  if (loading) return <div className="text-white p-6">Cargando...</div>;

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sucursales</h1>
        <button
          onClick={() => {
            setEditingStore(null);
            setForm({ name: "", location: "" });
            setModalOpen(true);
          }}
          className="bg-[#E8621A] px-4 py-2 rounded-full text-sm font-semibold"
        >
          + Nueva sucursal
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <div key={store.id} className="bt-panel rounded-2xl p-5 relative">
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => {
                  setEditingStore(store);
                  setForm({ name: store.name, location: store.location });
                  setModalOpen(true);
                }}
                className="text-[#9CA3AF] hover:text-white text-sm"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(store.id)}
                className="text-[#9CA3AF] hover:text-red-500 text-sm"
              >
                🗑️
              </button>
            </div>
            <h2 className="text-xl font-semibold">{store.name}</h2>
            <p className="text-sm text-[#9CA3AF]">{store.location}</p>
            <div className="mt-4 flex justify-between text-sm">
              <span>Inventarios: {store._count?.inventory ?? 0}</span>
              <span>Usuarios: {store._count?.users ?? 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-2xl p-6 w-96 border border-[#333]">
            <h2 className="text-xl font-bold mb-4">
              {editingStore ? "Editar sucursal" : "Nueva sucursal"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-[#333] bg-[#111] p-2 text-white"
                required
              />
              <input
                type="text"
                placeholder="Ubicación"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-lg border border-[#333] bg-[#111] p-2 text-white"
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#333]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#E8621A] text-white"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}