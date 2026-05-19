"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartWeb } from "../../../context/CartContextWeb";
import { formatCurrency } from "../../../lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartWeb();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "cash", // cash o card
  });

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
          })),
          total: totalPrice,
          customer: formData,
        }),
      });

      if (!response.ok) throw new Error("Error al crear el pedido");

      const { orderId } = await response.json();
      clearCart();
      router.push(`/confirmation/${orderId}`);
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al procesar tu pedido. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold text-white mb-8">Finalizar compra</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="customerName"
                  required
                  value={formData.customerName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#333333] bg-[#111111] p-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  required
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#333333] bg-[#111111] p-3 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1">
                Teléfono *
              </label>
              <input
                type="tel"
                name="customerPhone"
                required
                value={formData.customerPhone}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#333333] bg-[#111111] p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1">
                Dirección *
              </label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#333333] bg-[#111111] p-3 text-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#333333] bg-[#111111] p-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">
                  Código postal *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#333333] bg-[#111111] p-3 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1">
                Método de pago *
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#333333] bg-[#111111] p-3 text-white"
              >
                <option value="cash">Efectivo contra entrega</option>
                <option value="card">Tarjeta de crédito/débito</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#E8621A] py-3 font-semibold text-white transition hover:bg-[#c05210] disabled:opacity-50"
            >
              {isSubmitting ? "Procesando..." : "Confirmar pedido"}
            </button>
          </form>
        </div>

        {/* Resumen del pedido */}
        <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6 h-fit">
          <h2 className="text-xl font-bold text-white mb-4">Resumen</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#333333] mt-4 pt-4">
            <div className="flex justify-between font-bold text-white">
              <span>Total</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}