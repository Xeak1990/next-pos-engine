"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartWeb, CartItemWeb } from "../../../context/CartContextWeb";
import { formatCurrency } from "../../../lib/utils";

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

interface DeliveryInfo {
  method: "pickup" | "delivery";
  storeId?: string | null;
  storeName?: string | null;
  address?: {
    street: string;
    city: string;
    postalCode: string;
  } | null;
}

const IVA_RATE = 0.16;

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCartWeb();
  const { items, totalPrice, clearCart, storeId } = cart;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "cash",
  });

  const subtotal = totalPrice;
  const iva = subtotal * IVA_RATE;
  const discount = 0;
  const total = subtotal + iva - discount;

  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(currentDate)
    .toLowerCase();

  useEffect(() => {
    const saved = localStorage.getItem("deliveryInfo");
    if (saved) {
      try {
        const info = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDeliveryInfo(info);
      } catch (e) {
        console.error("Error parsing deliveryInfo", e);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/customer/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("No autenticado");
      })
      .then((data) => {
        if (isMounted && data) {
          const customerData = data.customer || data;
          setCustomer(customerData);
          setFormData({
            customerName: customerData.name || "",
            customerEmail: customerData.email || "",
            customerPhone: customerData.phone || "",
            address: customerData.address || "",
            city: customerData.city || "",
            postalCode: customerData.postalCode || "",
            paymentMethod: "cash",
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          const returnUrl = encodeURIComponent("/checkout");
          router.push(`/login?returnUrl=${returnUrl}`);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!loading && items.length === 0) {
      router.push("/cart");
    }
  }, [loading, items.length, router]);

  useEffect(() => {
    if (!loading && !customer && items.length > 0) {
      const returnUrl = encodeURIComponent("/checkout");
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [loading, customer, items.length, router]);

  if (loading) {
    return (
      <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible">
        <div className="flex items-center justify-center h-64">
          <p className="text-white text-lg">Cargando tus datos...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!deliveryInfo) {
      alert("No se ha seleccionado método de entrega. Regresa al carrito.");
      setIsSubmitting(false);
      return;
    }

    if (deliveryInfo.method === "pickup" && !deliveryInfo.storeId) {
      alert("No se ha seleccionado una sucursal para recoger. Regresa al carrito.");
      setIsSubmitting(false);
      return;
    }

    const customerObject = {
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone || undefined,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      paymentMethod: formData.paymentMethod,
    };

    if (!items || !Array.isArray(items)) {
      alert("No hay productos en el carrito");
      setIsSubmitting(false);
      return;
    }

    const orderPayload = {
      items: items.map((item: CartItemWeb) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
      })),
      total: total,
      customer: customerObject,
      customerId: customer.id,
      deliveryMethod: deliveryInfo.method,
      storeId: storeId,
      pickupStoreId: deliveryInfo.method === "pickup" ? deliveryInfo.storeId : undefined,
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMsg = `Error ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          errorMsg = errorJson.error || errorMsg;
        } catch {
          errorMsg = responseText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = JSON.parse(responseText);
      clearCart();
      localStorage.removeItem("deliveryInfo");
      setShowSuccessModal(true);
      setTimeout(() => {
        window.location.href = `/confirmation/${data.orderId}`;
      }, 2000);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Ocurrió un error al procesar tu pedido. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDelivery = deliveryInfo?.method === "delivery";

  return (
    <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible">
      <div className="mx-auto max-w-6xl">
        {/* Cabecera */}
        <div className="flex w-full items-start justify-between mb-[15px]">
          <div className="flex flex-col">
            <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
              <Link href="/" className="hover:text-white transition-colors duration-200">
                Principal/Catálogo web
              </Link>
              <span>/</span>
              <Link href="/cart" className="hover:text-white transition-colors duration-200">
                Carrito
              </Link>
              <span>/</span>
              <span className="text-[#e8621a]">Finalizar compra</span>
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
              Finalizar compra
            </h1>
            <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
              {formattedDate}
            </p>
          </div>
          <Link
            href="/cart"
            className="bt-button-ghost text-xs px-4 py-2 rounded-md"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            ← Volver al carrito
          </Link>
        </div>

        <div className="flex flex-row gap-[15px] items-start overflow-y-visible">
          <div className="flex-1 min-w-0">
            <div className="bt-panel rounded-[24px] shadow-[0_16px_45px_rgba(0,0,0,0.24)] p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campos del formulario (sin cambios) */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      required
                      value={formData.customerName}
                      onChange={handleChange}
                      className="w-full rounded-md border border-[#333333] bg-[#111111] p-3 text-sm text-white focus:border-[#E8621A] focus:outline-none"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      required
                      value={formData.customerEmail}
                      onChange={handleChange}
                      className="w-full rounded-md border border-[#333333] bg-[#111111] p-3 text-sm text-white focus:border-[#E8621A] focus:outline-none"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    required
                    value={formData.customerPhone}
                    onChange={handleChange}
                    className="w-full rounded-md border border-[#333333] bg-[#111111] p-3 text-sm text-white focus:border-[#E8621A] focus:outline-none"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  />
                </div>

                {isDelivery ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full rounded-md border border-[#333333] bg-[#111111] p-3 text-sm text-white focus:border-[#E8621A] focus:outline-none"
                        style={{ fontFamily: "Arial, sans-serif" }}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                          Ciudad *
                        </label>
                        <input
                          type="text"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full rounded-md border border-[#333333] bg-[#111111] p-3 text-sm text-white focus:border-[#E8621A] focus:outline-none"
                          style={{ fontFamily: "Arial, sans-serif" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                          Código postal *
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          required
                          value={formData.postalCode}
                          onChange={handleChange}
                          className="w-full rounded-md border border-[#333333] bg-[#111111] p-3 text-sm text-white focus:border-[#E8621A] focus:outline-none"
                          style={{ fontFamily: "Arial, sans-serif" }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  deliveryInfo?.storeName && (
                    <div className="rounded-md bg-[#1A3A5F]/20 border border-[#1A3A5F] p-3">
                      <p className="text-sm text-white">
                        Recogerás tu pedido en: <span className="font-semibold text-[#E8621A]">{deliveryInfo.storeName}</span>
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        Presenta este comprobante en la sucursal para recoger tus productos.
                      </p>
                    </div>
                  )
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">
                    Método de pago *
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full rounded-md border border-[#333333] bg-[#111111] p-3 text-sm text-white focus:border-[#E8621A] focus:outline-none"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    <option value="cash">Efectivo contra entrega</option>
                    <option value="card">Tarjeta de crédito/débito</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bt-button-primary w-full mt-4 py-3 text-center rounded-full text-xs tracking-[0.18em]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  {isSubmitting ? "Procesando..." : "Confirmar pedido"}
                </button>
              </form>
            </div>
          </div>

          <aside className="w-[320px] shrink-0">
            <div className="bt-panel rounded-[24px] shadow-[0_16px_45px_rgba(0,0,0,0.24)] p-5">
              <h2 className="text-xl font-bold text-white mb-4 font-sans">Resumen</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-[#D1D5DB]">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-mono text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#333333] mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#D1D5DB]">Subtotal</span>
                  <span className="font-mono text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#D1D5DB]">IVA (16%)</span>
                  <span className="font-mono text-white">{formatCurrency(iva)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#D1D5DB]">Descuento</span>
                    <span className="font-mono text-[#2ECC71]">- {formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="border-t border-[#333333] pt-2 mt-2">
                  <div className="flex justify-between font-bold text-white text-lg">
                    <span>Total</span>
                    <span className="font-mono">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl bg-[#1A1A1A] p-6 text-center shadow-xl border border-[#333]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2ECC71]/20">
              <svg className="h-6 w-6 text-[#2ECC71]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">¡Pedido confirmado!</h3>
            <p className="mt-2 text-sm text-[#9CA3AF]">
              Estamos preparando tu pedido. Serás redirigido en unos segundos...
            </p>
            <div className="mt-4 flex justify-center">
              <div className="h-1 w-16 overflow-hidden rounded-full bg-[#333]">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-[#E8621A]"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}