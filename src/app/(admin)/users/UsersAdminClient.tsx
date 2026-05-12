"use client";

import { useMemo, useState } from "react";

type StoreOption = {
  id: string;
  name: string;
  location: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
  isActive: boolean;
  store: StoreOption | null;
};

const roleOptions = ["ADMIN", "MANAGER", "CASHIER"] as const;

export default function UsersAdminClient({
  initialUsers,
  stores,
}: {
  initialUsers: UserRow[];
  stores: StoreOption[];
}) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER",
    storeId: "",
    isActive: true,
  });

  const mustAssignStore = useMemo(
    () => formValues.role === "MANAGER" || formValues.role === "CASHIER",
    [formValues.role]
  );

  const clearForm = () => {
    setFormValues({
      name: "",
      email: "",
      password: "",
      role: "CASHIER",
      storeId: "",
      isActive: true,
    });
    setErrorMessage(null);
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!formValues.name || !formValues.email || !formValues.password || !formValues.role) {
      setErrorMessage("Todos los campos obligatorios deben completarse.");
      return;
    }

    if (mustAssignStore && !formValues.storeId) {
      setErrorMessage("Debe seleccionar una sucursal para MANAGER o CASHIER.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "No se pudo crear el usuario.");
        setIsSubmitting(false);
        return;
      }

      setUsers((current) => [data, ...current]);
      setIsModalOpen(false);
      clearForm();
    } catch (error) {
      console.error(error);
      setErrorMessage("Error al crear el usuario. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserToggle = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, isActive: !isActive }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "No se pudo actualizar el estado.");
        return;
      }

      setUsers((current) =>
        current.map((user) => (user.id === id ? { ...user, isActive: data.isActive } : user))
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Error al actualizar el estado.");
    }
  };

  const filteredUsers = showInactive ? users : users.filter(user => user.isActive);

  return (
    <div className="max-w-[1440px] mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bebas uppercase tracking-widest text-white">Gestión de Usuarios</h1>
          <p className="text-gray-400 mt-2">Administra roles, sucursales y estado de los usuarios del sistema.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-[#E8621A] px-6 py-3 text-sm font-bold uppercase tracking-widest transition hover:brightness-110"
        >
          Nuevo Usuario
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-gray-800 bg-[#1A1A1A] p-4 shadow-xl shadow-black/40">
        <div className="mb-4">
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-[#E8621A] focus:ring-[#E8621A]"
            />
            Mostrar usuarios inactivos
          </label>
        </div>
        <table className="min-w-full border-collapse text-left text-sm text-gray-200">
          <thead>
            <tr>
              <th className="border-b border-gray-700 px-4 py-3 uppercase text-xs tracking-[0.25em] text-gray-400">Nombre</th>
              <th className="border-b border-gray-700 px-4 py-3 uppercase text-xs tracking-[0.25em] text-gray-400">Email</th>
              <th className="border-b border-gray-700 px-4 py-3 uppercase text-xs tracking-[0.25em] text-gray-400">Rol</th>
              <th className="border-b border-gray-700 px-4 py-3 uppercase text-xs tracking-[0.25em] text-gray-400">Sucursal</th>
              <th className="border-b border-gray-700 px-4 py-3 uppercase text-xs tracking-[0.25em] text-gray-400">Estado</th>
              <th className="border-b border-gray-700 px-4 py-3 uppercase text-xs tracking-[0.25em] text-gray-400">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={`border-b border-gray-800 hover:bg-white/5 transition-colors even:bg-white/5 ${!user.isActive ? 'opacity-50' : ''}`}>
                <td className="px-4 py-4 text-white font-medium">{user.name}</td>
                <td className="px-4 py-4 text-gray-300">{user.email}</td>
                <td className="px-4 py-4 text-[#E8621A] font-bold">{user.role}</td>
                <td className="px-4 py-4 text-gray-300">
                  {user.store ? `${user.store.name} (${user.store.location})` : "-"}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${user.isActive ? "bg-green-500/15 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                    {user.isActive ? "Activo" : "DESACTIVADO"}
                  </span>
                </td>
                <td className="px-4 py-4 space-x-2">
                  <button
                    type="button"
                    onClick={() => handleUserToggle(user.id, user.isActive)}
                    className={`rounded px-3 py-1 text-xs font-bold uppercase transition ${user.isActive ? "bg-red-500/15 text-red-300 hover:bg-red-500/25" : "bg-green-500/15 text-green-300 hover:bg-green-500/25"}`}
                  >
                    {user.isActive ? "DESACTIVAR" : "REACTIVAR"}
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="w-full max-w-2xl rounded-3xl border border-gray-800 bg-[#1A1A1A] p-8 shadow-2xl shadow-black/60">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bebas uppercase tracking-widest text-white">Nuevo Usuario</h2>
                <p className="text-gray-400 mt-1">Registra un nuevo usuario y asigna rol + sucursal.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  clearForm();
                }}
                className="rounded-full border border-gray-700 bg-transparent px-4 py-2 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleCreateUser}>
              {errorMessage && (
                <div className="rounded-2xl border border-red-600 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 text-sm text-gray-300">
                  <span>Nombre</span>
                  <input
                    value={formValues.name}
                    onChange={(event) => setFormValues({ ...formValues, name: event.target.value })}
                    className="w-full rounded-2xl border border-gray-700 bg-[#0F0F0F] px-4 py-3 text-white outline-none focus:border-[#E8621A]"
                    placeholder="Nombre completo"
                    required
                  />
                </label>

                <label className="space-y-2 text-sm text-gray-300">
                  <span>Email</span>
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(event) => setFormValues({ ...formValues, email: event.target.value })}
                    className="w-full rounded-2xl border border-gray-700 bg-[#0F0F0F] px-4 py-3 text-white outline-none focus:border-[#E8621A]"
                    placeholder="usuario@correo.com"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 text-sm text-gray-300">
                  <span>Contraseña</span>
                  <input
                    type="password"
                    value={formValues.password}
                    onChange={(event) => setFormValues({ ...formValues, password: event.target.value })}
                    className="w-full rounded-2xl border border-gray-700 bg-[#0F0F0F] px-4 py-3 text-white outline-none focus:border-[#E8621A]"
                    placeholder="********"
                    required
                  />
                </label>

                <label className="space-y-2 text-sm text-gray-300">
                  <span>Rol</span>
                  <select
                    value={formValues.role}
                    onChange={(event) => setFormValues({ ...formValues, role: event.target.value })}
                    className="w-full rounded-2xl border border-gray-700 bg-[#0F0F0F] px-4 py-3 text-white outline-none focus:border-[#E8621A]"
                  >
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {mustAssignStore && (
                <label className="space-y-2 text-sm text-gray-300">
                  <span>Sucursal</span>
                  <select
                    value={formValues.storeId}
                    onChange={(event) => setFormValues({ ...formValues, storeId: event.target.value })}
                    className="w-full rounded-2xl border border-gray-700 bg-[#0F0F0F] px-4 py-3 text-white outline-none focus:border-[#E8621A]"
                    required
                  >
                    <option value="">Selecciona una sucursal</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name} – {store.location}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="space-y-2 text-sm text-gray-300">
                <span>Estado</span>
                <select
                  value={formValues.isActive ? "ACTIVO" : "INACTIVO"}
                  onChange={(event) =>
                    setFormValues({ ...formValues, isActive: event.target.value === "ACTIVO" })
                  }
                  className="w-full rounded-2xl border border-gray-700 bg-[#0F0F0F] px-4 py-3 text-white outline-none focus:border-[#E8621A]"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </label>

              <div className="flex flex-col gap-4 pt-4 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    clearForm();
                  }}
                  className="rounded-full border border-gray-700 bg-transparent px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white transition hover:border-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-[#E8621A] px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Guardando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
