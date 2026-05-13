"use client";

import { useEffect, useState, useTransition } from "react";
import { updateStock } from "../../actions/inventory";
import { formatCurrency } from "../../lib/utils";

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
  { id: "all", label: "Todas" },
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

function matchesBranch(item: InventoryItem, branchId: (typeof branchButtons)[number]["id"]) {
  const normalizedStore = normalizeString(`${item.storeName} ${item.storeLocation}`);

  if (branchId === "all") {
    return true;
  }

  if (branchId === "centro-xalapa") {
    return normalizedStore.includes("centro xalapa") || normalizedStore.includes("centro historico");
  }

  if (branchId === "galeria-veracruz") {
    return normalizedStore.includes("galeria veracruz") || normalizedStore.includes("veracruz");
  }

  return normalizedStore.includes("plaza crystal") || normalizedStore.includes("plaza");
}

export default function InventoryTable({ initialData }: { initialData: InventoryItem[] }) {
  const [inventory, setInventory] = useState(initialData);
  const [user, setUser] = useState<{ role: string; storeId: string | null } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<(typeof branchButtons)[number]["id"]>("all");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setUser({ role: data.role, storeId: data.storeId });
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  const userScopedInventory =
    user?.role === "MANAGER" && user.storeId
      ? inventory.filter((item) => item.storeId === user.storeId)
      : inventory;

  const visibleInventory = userScopedInventory.filter((item) => matchesBranch(item, selectedBranch));
  const canModifyStock = user?.role === "ADMIN";

  const handleAdjust = (id: string, amount: number) => {
    const previousInventory = inventory;

    setInventory((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item,
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

  return (
    <section className="bt-panel overflow-hidden">
      <div className="border-b border-[#333333] bg-[#1A3A5F]/18 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Filtros de sucursal</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {branchButtons.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => setSelectedBranch(branch.id)}
                  className={
                    selectedBranch === branch.id
                      ? "bt-button-primary px-4 py-2 text-xs"
                      : "bt-button-ghost px-4 py-2 text-xs"
                  }
                >
                  {branch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[12px] border border-[#333333] bg-[#111111] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#94A3B8]">Registros visibles</p>
            <p className="mt-2 font-mono text-2xl font-bold text-white">{visibleInventory.length}</p>
          </div>
        </div>
      </div>

      <div className="bt-table-shell rounded-none border-0 bg-transparent">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="bt-table min-w-[980px]">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Talla</th>
                <th>Sucursal</th>
                <th>Precio</th>
                <th>Stock</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleInventory.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <p className="font-semibold text-white">{item.variant.product.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#94A3B8]">
                        {item.variant.color}
                      </p>
                    </div>
                  </td>
                  <td className="font-mono text-sm text-white">{item.variant.size}</td>
                  <td>
                    <div>
                      <p className="text-sm text-white">{item.storeName}</p>
                      <p className="mt-1 text-xs text-[#94A3B8]">{item.storeLocation}</p>
                    </div>
                  </td>
                  <td className="font-mono text-sm text-[#2ECC71]">
                    {formatCurrency(item.variant.price)}
                  </td>
                  <td>
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${
                        item.quantity <= 2
                          ? "bg-[#E8621A]/12 text-[#E8621A]"
                          : "bg-[#2ECC71]/12 text-[#2ECC71]"
                      }`}
                    >
                      {item.quantity} uds
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      {canModifyStock ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAdjust(item.id, -1)}
                            className="bt-button-ghost px-3 py-2 text-xs"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjust(item.id, 1)}
                            className="bt-button-primary px-3 py-2 text-xs"
                          >
                            +1
                          </button>
                        </>
                      ) : (
                        <span className="rounded-[8px] border border-[#333333] bg-[#111111] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#94A3B8]">
                          Solo lectura
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {visibleInventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-[#9CA3AF]">
                    No hay existencias para la sucursal seleccionada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPending && (
        <div className="border-t border-[#333333] bg-[#111111] px-5 py-3 text-xs uppercase tracking-[0.24em] text-[#94A3B8]">
          Sincronizando inventario...
        </div>
      )}
    </section>
  );
}
