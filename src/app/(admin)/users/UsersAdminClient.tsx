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
    [formValues.role],
  );

  const filteredUsers = showInactive ? users : users.filter((user) => user.isActive);

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
        current.map((user) => (user.id === id ? { ...user, isActive: data.isActive } : user)),
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Error al actualizar el estado.");
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.36em] text-[#94A3B8]">Administracion</p>
          <h1 className="mt-3 text-5xl tracking-wider text-white">Usuarios</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#9CA3AF]">
            Roles, sucursales y estado operativo de cada usuario del sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-3 rounded-[12px] border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-[#D1D5DB]">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
              className="h-4 w-4"
            />
            Mostrar inactivos
          </label>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bt-button-primary px-6 py-3 text-xs"
          >
            + Nuevo Usuario
          </button>
        </div>
      </div>

      <section className="bt-table-shell">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="bt-table min-w-[980px]">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Sucursal</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={user.isActive ? "" : "opacity-70"}>
                  <td>
                    <p className="font-semibold text-white">{user.name}</p>
                  </td>
                  <td className="font-mono text-sm text-[#D1D5DB]">{user.email}</td>
                  <td>
                    <span className="rounded-full border border-[#E8621A]/30 bg-[#E8621A]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#E8621A]">
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.store ? (
                      <div>
                        <p className="text-sm text-white">{user.store.name}</p>
                        <p className="mt-1 text-xs text-[#94A3B8]">{user.store.location}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-[#94A3B8]">Sin asignacion</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`bt-status-badge ${
                        user.isActive ? "bt-status-active" : "bt-status-inactive"
                      }`}
                    >
                      {user.isActive ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleUserToggle(user.id, user.isActive)}
                        className={user.isActive ? "bt-button-ghost px-4 py-2 text-xs" : "bt-button-primary px-4 py-2 text-xs"}
                      >
                        {user.isActive ? "Desactivar" : "Reactivar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-[#9CA3AF]">
                    No hay usuarios para la vista actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <div className="bt-panel w-full max-w-3xl p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Alta de usuario</p>
                <h2 className="mt-3 text-4xl text-white">Nuevo Usuario</h2>
                <p className="mt-2 text-sm text-[#9CA3AF]">
                  Completa el perfil operativo y asigna el acceso correspondiente.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  clearForm();
                }}
                className="bt-button-ghost px-4 py-2 text-xs"
              >
                Cerrar
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleCreateUser}>
              {errorMessage && (
                <div className="rounded-[12px] border border-[#E8621A]/30 bg-[#E8621A]/10 px-4 py-3 text-sm text-[#FED7AA]">
                  {errorMessage}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 text-sm text-[#D1D5DB]">
                  <span>Nombre</span>
                  <input
                    value={formValues.name}
                    onChange={(event) => setFormValues({ ...formValues, name: event.target.value })}
                    className="bt-input px-4 py-3"
                    placeholder="Nombre completo"
                    required
                  />
                </label>

                <label className="space-y-2 text-sm text-[#D1D5DB]">
                  <span>Email</span>
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(event) => setFormValues({ ...formValues, email: event.target.value })}
                    className="bt-input px-4 py-3"
                    placeholder="usuario@correo.com"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 text-sm text-[#D1D5DB]">
                  <span>Contrasena</span>
                  <input
                    type="password"
                    value={formValues.password}
                    onChange={(event) =>
                      setFormValues({ ...formValues, password: event.target.value })
                    }
                    className="bt-input px-4 py-3"
                    placeholder="********"
                    required
                  />
                </label>

                <label className="space-y-2 text-sm text-[#D1D5DB]">
                  <span>Rol</span>
                  <select
                    value={formValues.role}
                    onChange={(event) => setFormValues({ ...formValues, role: event.target.value })}
                    className="bt-input px-4 py-3"
                  >
                    {roleOptions.map((option) => (
                      <option key={option} value={option} className="bg-[#1A1A1A] text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {mustAssignStore && (
                <label className="space-y-2 text-sm text-[#D1D5DB]">
                  <span>Sucursal</span>
                  <select
                    value={formValues.storeId}
                    onChange={(event) =>
                      setFormValues({ ...formValues, storeId: event.target.value })
                    }
                    className="bt-input px-4 py-3"
                    required
                  >
                    <option value="" className="bg-[#1A1A1A] text-white">
                      Selecciona una sucursal
                    </option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id} className="bg-[#1A1A1A] text-white">
                        {store.name} - {store.location}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="space-y-2 text-sm text-[#D1D5DB]">
                <span>Estado</span>
                <select
                  value={formValues.isActive ? "ACTIVO" : "INACTIVO"}
                  onChange={(event) =>
                    setFormValues({ ...formValues, isActive: event.target.value === "ACTIVO" })
                  }
                  className="bt-input px-4 py-3"
                >
                  <option value="ACTIVO" className="bg-[#1A1A1A] text-white">
                    ACTIVO
                  </option>
                  <option value="INACTIVO" className="bg-[#1A1A1A] text-white">
                    INACTIVO
                  </option>
                </select>
              </label>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    clearForm();
                  }}
                  className="bt-button-ghost px-6 py-3 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bt-button-primary px-6 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-60"
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
