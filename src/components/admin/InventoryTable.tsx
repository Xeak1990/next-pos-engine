"use client";

import { useEffect, useState, useTransition } from "react";
import { updateStock } from "../../actions/inventory";

interface InventoryItem {
  id: string;
  quantity: number;
  storeId: string;
  storeName: string;
  storeLocation: string;
  variant: {
    size: string;
    color: string;
    price: string;
    product: {
      name: string;
    };
  };
}

const branchButtons = [
  { id: "centro-xalapa", label: "Centro Xalapa" },
  { id: "galeria-veracruz", label: "Galeria Veracruz" },
  { id: "plaza-crystal", label: "Plaza Crystal" },
] as const;

function normalizeString(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesBranch(
  item: InventoryItem,
  branchId: (typeof branchButtons)[number]["id"],
) {
  const normalizedStore = normalizeString(
    `${item.storeName} ${item.storeLocation}`,
  );

  if (branchId === "centro-xalapa") {
    return (
      normalizedStore.includes("centro xalapa") ||
      normalizedStore.includes("centro historico")
    );
  }
  if (branchId === "galeria-veracruz") {
    return (
      normalizedStore.includes("galeria veracruz") ||
      normalizedStore.includes("veracruz")
    );
  }
  return (
    normalizedStore.includes("plaza crystal") ||
    normalizedStore.includes("plaza")
  );
}

function getBranchIdFromStore(storeName: string, storeLocation: string) {
  const normalizedStore = normalizeString(`${storeName} ${storeLocation}`);
  if (
    normalizedStore.includes("centro xalapa") ||
    normalizedStore.includes("centro historico")
  ) {
    return "centro-xalapa";
  }
  if (
    normalizedStore.includes("galeria veracruz") ||
    normalizedStore.includes("veracruz")
  ) {
    return "galeria-veracruz";
  }
  return "plaza-crystal";
}

export default function InventoryTable({
  initialData,
}: {
  initialData: InventoryItem[];
}) {
  const [inventory, setInventory] = useState(initialData);
  const [user, setUser] = useState<{
    role: string;
    storeId: string | null;
  } | null>(null);
  const [selectedBranch, setSelectedBranch] =
    useState<(typeof branchButtons)[number]["id"]>("centro-xalapa");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return;
        const data = await response.json();
        const customer = data.customer;
        if (!customer) {
          console.error("No customer data in response");
          return;
        }
        const role = (customer.role || "").toUpperCase();
        setUser({ role, storeId: customer.storeId || null });

        if (role === "MANAGER" && customer.storeId) {
          const scopedItem = initialData.find(
            (item) => item.storeId === customer.storeId,
          );
          if (scopedItem) {
            setSelectedBranch(
              getBranchIdFromStore(
                scopedItem.storeName,
                scopedItem.storeLocation,
              ),
            );
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, [initialData]);

  const canModifyStock = user?.role === "ADMIN";
  const canChangeBranch = user?.role === "ADMIN" || user?.role === "MANAGER";

  const visibleInventory = inventory.filter((item) => {
    if (!canChangeBranch && user?.storeId) {
      return item.storeId === user.storeId;
    }
    return matchesBranch(item, selectedBranch);
  });

  const handleAdjust = (id: string, amount: number) => {
    if (!canModifyStock) return;

    const previousInventory = inventory;
    setInventory((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + amount) }
          : item,
      ),
    );
    startTransition(async () => {
      const result = await updateStock(id, amount);
      if (!result.success) {
        window.alert(result.error);
        setInventory(previousInventory);
      }
    });
  };

  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(now)
    .toLowerCase();

  return (
    <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible">
      {/* Cabecera estilo Dashboard */}
      <div className="flex w-full items-start justify-between mb-[15px]">
        <div className="flex flex-col">
          <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <span className="hover:text-white transition-colors duration-200 cursor-default">
              Operaciones
            </span>
            <span>/</span>
            <span className="text-[#e8621a]">Inventario</span>
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
            Inventario
          </h1>
          <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] opacity-80">
            Stock por sucursal
          </p>
          <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Botones de sucursal (fuera del panel, secuenciales) */}
      <div className="mb-[10px]">
        <div className="flex flex-wrap gap-[10px]">
          {branchButtons.map((branch) => {
            const isActive = selectedBranch === branch.id;
            let disabled = false;
            if (!canChangeBranch && user?.storeId) {
              const ownStoreItem = inventory.find(
                (item) => item.storeId === user.storeId,
              );
              if (ownStoreItem) {
                const ownBranchId = getBranchIdFromStore(
                  ownStoreItem.storeName,
                  ownStoreItem.storeLocation,
                );
                disabled = branch.id !== ownBranchId;
              } else {
                disabled = true;
              }
            }

            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedBranch(branch.id)}
                disabled={disabled}
                className={`px-4 py-[10px] text-xs font-[600] uppercase tracking-[0.18em] rounded-[7px] transition-all ${
                  isActive
                    ? "bg-[#E8621A] text-white border border-[#E8621A] shadow-md"
                    : "bg-[#2A2A2A] text-white border border-transparent hover:bg-[#2C2C2C] disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
                style={{ color: "#FFFFFF", fontFamily: "Arial, sans-serif" }}
              >
                {branch.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* NUEVA FILA DE INFORMACIÓN: Variantes activas + Registros visibles */}
      <div className="flex flex-wrap gap-[10px] mb-[10px]">
        {/* Panel azul: Variantes activas (total de registros) */}
        <div className="bt-panel-blue rounded-[12px] px-5 py-4 flex-1 min-w-[180px]">
          <p className="text-xs uppercase tracking-[0.3em] text-[#C9D8EA] font-semibold">
            Variantes activas
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">
            {inventory.length}
          </p>
        </div>

        {/* Panel gris: Registros visibles (filtrados) */}
        <div className="rounded-[14px] border border-[#333333] bg-[#111111] px-5 py-4 flex-1 min-w-[180px]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#94A3B8] font-semibold">
            Registros visibles
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">
            {visibleInventory.length}
          </p>
        </div>
      </div>

      {/* Panel principal (bt-panel) ahora solo con la tabla */}
      <div className="bt-panel rounded-[24px] shadow-[0_16px_45px_rgba(0,0,0,0.24)] p-5">
        {/* Tabla de inventario */}
        <div className="bt-table-shell rounded-[24px] overflow-hidden border border-[#2A2A2A]">
          <div className="custom-scrollbar overflow-x-auto">
            <table className="bt-table min-w-[760px] table-fixed w-full">
              <colgroup>
                <col className="w-[44%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="bg-[#1A1A1A]">
                <tr>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">
                    Producto
                  </th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">
                    Talla
                  </th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">
                    Stock
                  </th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleInventory.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-[#222222] hover:bg-[#1A1A1A]/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-white font-sans">
                          {item.variant.product.name} 
                        </p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#94A3B8]">
                          {item.variant.color} 
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-white">
                      {item.variant.size}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block !rounded-[12px] px-3 py-1 font-mono text-xs font-semibold ${
                          item.quantity <= 2
                            ? "bg-[#E8621A]/15 text-[#E8621A]"
                            : "bg-[#2ECC71]/15 text-[#2ECC71]"
                        }`}
                        style={{
                          display: "inline-block",
                          borderRadius: "9999px",
                          backgroundColor: "#1E2A1C",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "#2ECC71",
                          lineHeight: "1",
                          boxShadow:
                            "inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      >
                        {item.quantity} uds
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-[5px]">
                        {canModifyStock ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAdjust(item.id, -1)}
                              className="inline-flex items-center justify-center w-[30px] h-[30px] text-xs font-semibold rounded-[5px] border-none bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]"
                              style={{
                                color: "#FFFFFF",
                                fontFamily: "Arial, sans-serif",
                              }}
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjust(item.id, 1)}
                              className="inline-flex items-center justify-center w-[30px] h-[30px] text-xs font-bold uppercase tracking-[0.12em] rounded-[5px] border-none bg-[#E8621A] text-white hover:bg-[#f07330] transition-colors"
                              style={{
                                color: "#FFFFFF",
                                fontFamily: "Arial, sans-serif",
                              }}
                            >
                              +1
                            </button>
                          </>
                        ) : (
                          <span className="px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#6B7280] font-medium">
                            Solo consulta
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleInventory.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-14 text-center text-sm text-[#9CA3AF] font-sans"
                    >
                      No hay existencias para la sucursal seleccionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estado de sincronización */}
        {isPending && (
          <div className="mt-4 rounded-[14px] border border-[#333333] bg-[#111111] px-5 py-3 text-xs uppercase tracking-[0.24em] text-[#94A3B8] text-center">
            Sincronizando inventario...
          </div>
        )}
      </div>
    </div>
  );
}
