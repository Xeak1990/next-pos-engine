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

function matchesBranch(item: InventoryItem, branchId: (typeof branchButtons)[number]["id"]) {
  const normalizedStore = normalizeString(`${item.storeName} ${item.storeLocation}`);

  if (branchId === "centro-xalapa") {
    return normalizedStore.includes("centro xalapa") || normalizedStore.includes("centro historico");
  }

  if (branchId === "galeria-veracruz") {
    return normalizedStore.includes("galeria veracruz") || normalizedStore.includes("veracruz");
  }

  return normalizedStore.includes("plaza crystal") || normalizedStore.includes("plaza");
}

function getBranchIdFromStore(storeName: string, storeLocation: string) {
  const normalizedStore = normalizeString(`${storeName} ${storeLocation}`);

  if (normalizedStore.includes("centro xalapa") || normalizedStore.includes("centro historico")) {
    return "centro-xalapa";
  }

  if (normalizedStore.includes("galeria veracruz") || normalizedStore.includes("veracruz")) {
    return "galeria-veracruz";
  }

  return "plaza-crystal";
}

export default function InventoryTable({ initialData }: { initialData: InventoryItem[] }) {
  const [inventory, setInventory] = useState(initialData);
  const [user, setUser] = useState<{ role: string; storeId: string | null } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<(typeof branchButtons)[number]["id"]>(
    "centro-xalapa",
  );
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

        if (data.storeId) {
          const scopedItem = initialData.find((item) => item.storeId === data.storeId);
          if (scopedItem) {
            setSelectedBranch(getBranchIdFromStore(scopedItem.storeName, scopedItem.storeLocation));
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [initialData]);

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
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="grid gap-4 md:grid-cols-3">
          {branchButtons.map((branch) => {
            const isActive = selectedBranch === branch.id;

            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedBranch(branch.id)}
                className={
                  isActive
                    ? "rounded-[12px] border border-[#E8621A] bg-[#E8621A] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_28px_rgba(232,98,26,0.18)]"
                    : "rounded-[12px] border border-[#333333] bg-[#1A1A1A] px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#CBD5E1] hover:border-[#E8621A] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                }
                disabled={Boolean(user?.storeId && !canModifyStock && selectedBranch !== branch.id)}
              >
                {branch.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-[12px] border border-[#333333] bg-[#1A1A1A] px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#94A3B8]">Registros visibles</p>
          <p className="mt-2 font-mono text-3xl font-bold text-white">{visibleInventory.length}</p>
        </div>
      </div>

      <div className="bt-table-shell">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="bt-table min-w-[760px] table-fixed">
            <colgroup>
              <col className="w-[44%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Talla</th>
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
                        {item.variant.color} / {item.storeName}
                      </p>
                    </div>
                  </td>
                  <td className="font-mono text-sm text-white">{item.variant.size}</td>
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
                        <span className="px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#6B7280]">
                          --
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {visibleInventory.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center text-sm text-[#9CA3AF]">
                    No hay existencias para la sucursal seleccionada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPending && (
        <div className="rounded-[12px] border border-[#333333] bg-[#1A1A1A] px-5 py-3 text-xs uppercase tracking-[0.24em] text-[#94A3B8]">
          Sincronizando inventario...
        </div>
      )}
    </section>
  );
}
