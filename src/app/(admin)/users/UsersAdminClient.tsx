"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

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

function AdminModal({ children }: { children: ReactNode }) {
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

export default function UsersAdminClient({
  initialUsers,
  stores,
}: {
  initialUsers: UserRow[];
  stores: StoreOption[];
}) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER",
    storeId: "",
    isActive: true,
  });
  const [editFormValues, setEditFormValues] = useState({
    name: "",
    role: "CASHIER",
    storeId: "",
  });

  // ============================================================
  // ANCHO DEL MODAL (en píxeles) – AJUSTA ESTE VALOR A TU GUSTO
  // ============================================================
  const MODAL_WIDTH_PX = 500;
  // ============================================================

  const mustAssignStore = useMemo(
    () => formValues.role === "MANAGER" || formValues.role === "CASHIER",
    [formValues.role],
  );
  const mustAssignStoreEdit = useMemo(
    () => editFormValues.role === "MANAGER" || editFormValues.role === "CASHIER",
    [editFormValues.role],
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

  const clearEditForm = () => {
    setEditFormValues({ name: "", role: "CASHIER", storeId: "" });
    setEditingUser(null);
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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

  const handleEditUser = (user: UserRow) => {
    setEditingUser(user);
    setEditFormValues({
      name: user.name,
      role: user.role,
      storeId: user.store?.id || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!editFormValues.name) {
      setErrorMessage("El nombre es obligatorio.");
      return;
    }

    if (mustAssignStoreEdit && !editFormValues.storeId) {
      setErrorMessage("Debe seleccionar una sucursal para MANAGER o CASHIER.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser!.id,
          name: editFormValues.name,
          role: editFormValues.role,
          storeId: editFormValues.storeId || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "No se pudo actualizar el usuario.");
        return;
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === editingUser!.id
            ? { ...user, name: data.name, role: data.role, store: data.store }
            : user,
        ),
      );
      setIsEditModalOpen(false);
      clearEditForm();
    } catch (error) {
      console.error(error);
      setErrorMessage("Error al actualizar el usuario. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Cabecera sin cambios */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col">
          <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <Link href="/" className="hover:text-white transition-colors duration-200">
              Principal
            </Link>
            <span>/</span>
            <span className="text-[#e8621a]">Usuarios</span>
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
            Usuarios
          </h1>
          <p className="mt-3 text-sm text-[#9CA3AF]">Gestión de accesos y roles del sistema.</p>
        </div>

        <div className="flex flex-wrap items-center gap-[5px]">
          <label className="flex items-center gap-3 mb-[2.5px] rounded-[10px] border border-[#333333] bg-[#1A1A1A] px-[10px] py-[7px] text-sm text-[#D1D5DB]">
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
            className="bt-button-primary text-xs rounded-[12px] bg-[#E8621A] text-white hover:bg-[#E8621A]/80 transition-colors duration-200"
            style={{
              fontFamily: "Arial, sans-serif",
              padding: "7px 10px !important",
              minHeight: "auto !important",
            }}
          >
            + Nuevo Usuario
          </button>
        </div>
      </div>

      <section className="bt-table-shell">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="bt-table min-w-[980px]">
            <thead className="bg-[#2A2A2A]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.22em] text-[#CBD5E1]">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.22em] text-[#CBD5E1]">Email</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.22em] text-[#CBD5E1]">Rol</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.22em] text-[#CBD5E1]">Sucursal</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.22em] text-[#CBD5E1]">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-[0.22em] text-[#CBD5E1]">Acciones</th>
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
                    <span
                      className={`bt-status-badge ${
                        user.role === "ADMIN"
                          ? "bg-[#E8621A]/12 text-[#E8621A] border border-[#E8621A]/30"
                          : "bg-[#1A3A5F]/30 text-[#5A9EFF] border border-[#1A3A5F]/50"
                      }`}
                    >
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
                      <span className="text-sm text-[#94A3B8]">Sin asignación</span>
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
                    <div className="flex justify-end gap-[5px]">
                      <button
                        type="button"
                        onClick={() => handleEditUser(user)}
                        className="bt-button-ghost px-4 py-2 text-xs rounded-[12px] border border-[#333333] text-[#D1D5DB] hover:bg-[#333333]/20 transition-colors duration-200"
                        style={{ fontFamily: "Arial, sans-serif" }}
                      >
                        Editar
                      </button>
                      {user.role !== "ADMIN" && (
                        <button
                          type="button"
                          onClick={() => handleUserToggle(user.id, user.isActive)}
                          className={
                            user.isActive
                              ? "bt-button-ghost px-4 py-2 text-xs rounded-[12px] border border-[#333333] text-[#D1D5DB] hover:bg-[#333333]/20 transition-colors duration-200"
                              : "bt-button-primary px-4 py-2 text-xs rounded-[12px] bg-[#E8621A] text-white hover:bg-[#E8621A]/80 transition-colors duration-200"
                          }
                          style={{ fontFamily: "Arial, sans-serif" }}
                        >
                          {user.isActive ? "Desactivar" : "Reactivar"}
                        </button>
                      )}
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

      {/* Modal de creación de usuario - con separación de 8px y mayor padding vertical */}
      {isModalOpen && (
        <AdminModal>
          <div
            role="dialog"
            aria-modal="true"
            className="custom-scrollbar overflow-y-auto rounded-[24px] bg-[#1A1A1A] shadow-xl max-h-[90vh] border border-gray-600"
            style={{ width: `${MODAL_WIDTH_PX}px` }}
          >
            {/* Padding interno aumentado a 15px arriba/abajo y 20px laterales, separación de 8px */}
            <div className="w-[88%] mx-auto px-[20px] py-[15px] space-y-[8px]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]" style={{ fontFamily: "Arial, sans-serif" }}>
                    Alta de usuario
                  </p>
                  <h2 className="mt-1 text-4xl text-white" style={{ fontFamily: "Arial, sans-serif" }}>
                    Nuevo Usuario
                  </h2>
                  <p className="mt-1 text-sm text-[#9CA3AF]" style={{ fontFamily: "Arial, sans-serif" }}>
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
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Cerrar
                </button>
              </div>

              <form className="space-y-[8px]" onSubmit={handleCreateUser}>
                {errorMessage && (
                  <div className="rounded-[12px] border border-[#E8621A]/30 bg-[#E8621A]/10 px-4 py-3 text-sm text-[#FED7AA]" style={{ fontFamily: "Arial, sans-serif" }}>
                    {errorMessage}
                  </div>
                )}

                <div className="grid gap-[8px] md:grid-cols-2">
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]" style={{ fontFamily: "Arial, sans-serif" }}>
                    <span>Nombre</span>
                    <input
                      value={formValues.name}
                      onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      placeholder="Nombre completo"
                      required
                      style={{ fontFamily: "Arial, sans-serif" }}
                    />
                  </label>
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]" style={{ fontFamily: "Arial, sans-serif" }}>
                    <span>Email</span>
                    <input
                      type="email"
                      value={formValues.email}
                      onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      placeholder="usuario@correo.com"
                      required
                      style={{ fontFamily: "Arial, sans-serif" }}
                    />
                  </label>
                </div>

                <div className="grid gap-[8px] md:grid-cols-2">
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]" style={{ fontFamily: "Arial, sans-serif" }}>
                    <span>Contraseña</span>
                    <input
                      type="password"
                      value={formValues.password}
                      onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      placeholder="********"
                      required
                      style={{ fontFamily: "Arial, sans-serif" }}
                    />
                  </label>
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]" style={{ fontFamily: "Arial, sans-serif" }}>
                    <span>Rol</span>
                    <select
                      value={formValues.role}
                      onChange={(e) => setFormValues({ ...formValues, role: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      {roleOptions.map((option) => (
                        <option key={option} value={option} className="bg-[#1A1A1A] text-white" style={{ fontFamily: "Arial, sans-serif" }}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {mustAssignStore && (
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]" style={{ fontFamily: "Arial, sans-serif" }}>
                    <span>Sucursal</span>
                    <select
                      value={formValues.storeId}
                      onChange={(e) => setFormValues({ ...formValues, storeId: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      required
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      <option value="" className="bg-[#1A1A1A] text-white" style={{ fontFamily: "Arial, sans-serif" }}>
                        Selecciona una sucursal
                      </option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id} className="bg-[#1A1A1A] text-white" style={{ fontFamily: "Arial, sans-serif" }}>
                          {store.name} - {store.location}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="space-y-[5px] text-sm text-[#D1D5DB]" style={{ fontFamily: "Arial, sans-serif" }}>
                  <span>Estado</span>
                  <select
                    value={formValues.isActive ? "ACTIVO" : "INACTIVO"}
                    onChange={(e) =>
                      setFormValues({ ...formValues, isActive: e.target.value === "ACTIVO" })
                    }
                    className="bt-input w-full px-4 py-3"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    <option value="ACTIVO" className="bg-[#1A1A1A] text-white" style={{ fontFamily: "Arial, sans-serif" }}>ACTIVO</option>
                    <option value="INACTIVO" className="bg-[#1A1A1A] text-white" style={{ fontFamily: "Arial, sans-serif" }}>INACTIVO</option>
                  </select>
                </label>

                <div className="flex flex-col gap-[8px] pt-[8px] sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      clearForm();
                    }}
                    className="bt-button-ghost px-6 py-3 text-xs"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bt-button-primary px-6 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    {isSubmitting ? "Guardando..." : "Crear Usuario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Modal de edición de usuario - mismas mejoras */}
      {isEditModalOpen && editingUser && (
        <AdminModal>
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
                    Editar usuario
                  </p>
                  <h2 className="mt-1 text-4xl text-white" style={{ fontFamily: "Arial, sans-serif" }}>
                    Editar Usuario
                  </h2>
                  <p className="mt-1 text-sm text-[#9CA3AF]" style={{ fontFamily: "Arial, sans-serif" }}>
                    Modifica el nombre, rol o sucursal del usuario.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    clearEditForm();
                  }}
                  className="bt-button-ghost px-4 py-2 text-xs"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Cerrar
                </button>
              </div>

              <form className="space-y-[8px]" onSubmit={handleUpdateUser}>
                {errorMessage && (
                  <div className="rounded-[12px] border border-[#E8621A]/30 bg-[#E8621A]/10 px-4 py-3 text-sm text-[#FED7AA]" style={{ fontFamily: "Arial, sans-serif" }}>
                    {errorMessage}
                  </div>
                )}

                <div className="grid gap-[8px] md:grid-cols-2">
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]" style={{ fontFamily: "Arial, sans-serif" }}>
                    <span>Nombre</span>
                    <input
                      value={editFormValues.name}
                      onChange={(e) => setEditFormValues({ ...editFormValues, name: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      placeholder="Nombre completo"
                      required
                      style={{ fontFamily: "Arial, sans-serif" }}
                    />
                  </label>
                  <div className="space-y-[5px] text-sm text-[#D1D5DB]" style={{ fontFamily: "Arial, sans-serif" }}>
                    <span>Email (no editable)</span>
                    <input
                      type="email"
                      value={editingUser.email}
                      disabled
                      className="bt-input w-full px-4 py-3 opacity-70 cursor-not-allowed"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    />
                  </div>
                </div>

                <div className="grid gap-[8px] md:grid-cols-2">
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]" style={{ fontFamily: "Arial, sans-serif" }}>
                    <span>Rol</span>
                    <select
                      value={editFormValues.role}
                      onChange={(e) => setEditFormValues({ ...editFormValues, role: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      {roleOptions.map((option) => (
                        <option key={option} value={option} className="bg-[#1A1A1A] text-white" style={{ fontFamily: "Arial, sans-serif" }}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {mustAssignStoreEdit && (
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]" style={{ fontFamily: "Arial, sans-serif" }}>
                    <span>Sucursal</span>
                    <select
                      value={editFormValues.storeId}
                      onChange={(e) => setEditFormValues({ ...editFormValues, storeId: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      required
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      <option value="" className="bg-[#1A1A1A] text-white" style={{ fontFamily: "Arial, sans-serif" }}>
                        Selecciona una sucursal
                      </option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id} className="bg-[#1A1A1A] text-white" style={{ fontFamily: "Arial, sans-serif" }}>
                          {store.name} - {store.location}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="flex flex-col gap-[8px] pt-[8px] sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      clearEditForm();
                    }}
                    className="bt-button-ghost px-6 py-3 text-xs"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bt-button-primary px-6 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    {isSubmitting ? "Guardando..." : "Actualizar Usuario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}