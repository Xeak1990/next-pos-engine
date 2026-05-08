"use client";

import { updateStock } from "../../actions/inventory";
import { formatCurrency } from "../../lib/utils";
import { useState } from "react";

interface InventoryItem {
  id: string;
  quantity: number;
  variant: {
    size: string;
    color: string;
    price: string // Decimal de Prisma
    product: {
      name: string;
    };
  };
}

export default function InventoryTable({ initialData }: { initialData: InventoryItem[] }) {
  const [inventory, setInventory] = useState(initialData);

  const handleAdjust = async (id: string, amount: number) => {
    // Optimistic update para que se sienta instantáneo (Sincronización real RF07)
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item
      )
    );

    const result = await updateStock(id, amount);
    if (!result.success) {
      alert(result.error);
      // Revertir si falla
      setInventory(initialData);
    }
  };

  return (
    <div className="overflow-x-auto bg-bt-surface rounded-lg border border-gray-800">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400 uppercase text-xs font-semibold">
            <th className="p-4">Producto</th>
            <th className="p-4">Talla</th>
            <th className="p-4 text-center">Stock</th>
            <th className="p-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="text-bt-light">
          {inventory.map((item) => (
            <tr key={item.id} className="border-b border-gray-900 hover:bg-gray-800/50 transition-colors">
              <td className="p-4">
                <div className="font-bold text-white">{item.variant.product.name}</div>
                <div className="text-sm text-gray-500">{item.variant.color}</div>
              </td>
              <td className="p-4 text-gray-300 font-mono">{item.variant.size}</td>
              <td className="p-4 text-center">
                <span className={`font-bold ${item.quantity <= 2 ? 'text-bt-error' : 'text-bt-success'}`}>
                  {item.quantity}
                </span>
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleAdjust(item.id, -1)}
                    className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => handleAdjust(item.id, 1)}
                    className="px-3 py-1 bg-bt-orange text-white rounded hover:bg-orange-600 transition-colors"
                  >
                    +1
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}