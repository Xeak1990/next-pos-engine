"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartWeb } from "../../../context/CartContextWeb";
import { formatCurrency } from "../../../lib/utils";

type Store = {
  id: string;
  name: string;
  location: string;
};

export default function CartPage() {
  const router = useRouter();
  const { items, totalPrice, updateQuantity, removeItem, clearCart, storeId: cartStoreId, storeName: cartStoreName } = useCartWeb();

  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [deliveryAddress] = useState({
    street: "",
    city: "",
    postalCode: "",
  });

  useEffect(() => {
    fetch("/api/stores")
      .then((res) => res.json())
      .then((data) => {
        let storesArray: Store[] = [];
        if (Array.isArray(data)) {
          storesArray = data;
        } else if (data.stores && Array.isArray(data.stores)) {
          storesArray = data.stores;
        }
        setStores(storesArray);
        if (storesArray.length > 0 && !cartStoreId) {
          setSelectedStoreId(storesArray[0].id);
        } else if (cartStoreId) {
          setSelectedStoreId(cartStoreId);
        }
      })
      .catch((error) => {
        console.error("Error al cargar sucursales:", error);
        setStores([]);
      });
  }, [cartStoreId]);

  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(currentDate)
    .toLowerCase();

  if (items.length === 0) {
    return (
      <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-xl text-white">Tu carrito está vacío</p>
          <button
            onClick={() => router.push("/")}
            className="bt-button-primary mt-4 rounded-full px-6 py-2 text-sm font-semibold text-white"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            Seguir comprando
          </button>
        </div>
      </div>
    );
  }

  const handleProceedToCheckout = () => {
    let finalStoreId: string | null = null;
    if (deliveryMethod === "pickup") {
      finalStoreId = cartStoreId || selectedStoreId;
    }
    const deliveryInfo = {
      method: deliveryMethod,
      storeId: finalStoreId,
      address: deliveryMethod === "delivery" ? deliveryAddress : null,
    };
    localStorage.setItem("deliveryInfo", JSON.stringify(deliveryInfo));
    window.location.href = "/checkout";
  };

  return (
    <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible">
      <div className="flex w-full items-start justify-between mb-[15px]">
        <div className="flex flex-col">
          <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <Link href="/" className="hover:text-white transition-colors duration-200">
              Principal/Catálogo Web
            </Link>
            <span>/</span>
            <span className="text-[#e8621a]">Carrito</span>
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
            Carrito
          </h1>
          <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
            {formattedDate}
          </p>
        </div>
      </div>

      <div className="flex flex-row gap-[15px] items-start overflow-y-visible">
        <div className="flex-1 min-w-0">
          <div className="bt-panel rounded-[24px] shadow-[0_16px_45px_rgba(0,0,0,0.24)] p-5">
            {/* Cabecera de acciones: ambos son botones ahora */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={clearCart}
                className="bt-button-ghost text-xs px-4 py-2 rounded-md"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                Vaciar carrito
              </button>
              <button
                onClick={() => router.push("/")}
                className="bt-button-ghost text-xs px-4 py-2 rounded-md"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                Seguir comprando
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row gap-4 border-b border-[#222222] pb-4 last:border-0"
                >
                  <div className="h-24 w-24 flex-shrink-0 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white font-sans">{item.name}</h3>
                    {item.size && (
                      <p className="text-sm text-[#9CA3AF] font-mono">Talla: {item.size}</p>
                    )}
                    <p className="mt-1 font-mono text-[#E8621A] font-bold">
                      {formatCurrency(item.price)}
                    </p>
                    {item.storeName && (
                      <p className="text-xs text-[#6B7280] mt-1">Tienda: {item.storeName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="text-white text-2xl bg-transparent border-none p-0 w-8 h-8 flex items-center justify-center"
                        style={{ background: 'transparent', border: 'none', boxShadow: 'none', color: 'white' }}
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-white text-base">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="text-white text-2xl bg-transparent border-none p-0 w-8 h-8 flex items-center justify-center"
                        style={{ background: 'transparent', border: 'none', boxShadow: 'none', color: 'white' }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="bt-button-gray text-xs px-3 py-1"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="w-[320px] shrink-0">
          <div className="bt-panel rounded-[24px] shadow-[0_16px_45px_rgba(0,0,0,0.24)] p-5">
            <h2 className="text-xl font-bold text-white mb-4 font-sans">Resumen</h2>

            <div className="mb-4 border-b border-[#333333] pb-4">
              <p className="text-sm font-semibold text-white mb-2">Método de entrega</p>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 text-sm text-white">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={deliveryMethod === "pickup"}
                    onChange={() => setDeliveryMethod("pickup")}
                    className="accent-[#E8621A]"
                  />
                  Recoger en tienda
                </label>
                <label className="flex items-center gap-2 text-sm text-white">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    checked={deliveryMethod === "delivery"}
                    onChange={() => setDeliveryMethod("delivery")}
                    className="accent-[#E8621A]"
                  />
                  Envío a domicilio
                </label>
              </div>

              {deliveryMethod === "pickup" && (
                <div className="mt-2">
                  {cartStoreId && cartStoreName ? (
                    <div className="text-sm text-white">
                      Recogerás en: <span className="text-[#E8621A] font-semibold">{cartStoreName}</span>
                      <p className="text-xs text-[#6B7280] mt-1">(Todos los productos son de esta tienda)</p>
                    </div>
                  ) : (
                    <>
                      <label className="block text-xs text-[#9CA3AF] mb-1">Selecciona sucursal</label>
                      <select
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        className="w-full rounded-md border border-[#333333] bg-[#111111] text-white text-sm p-2 focus:border-[#E8621A] outline-none"
                      >
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name} - {store.location}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm font-sans">
              <div className="flex justify-between text-[#D1D5DB]">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-[#D1D5DB]">
                <span>Envío</span>
                <span>{deliveryMethod === "delivery" ? "A calcular" : "Gratis"}</span>
              </div>
              <div className="border-t border-[#333333] pt-2 mt-2">
                <div className="flex justify-between font-bold text-white text-lg">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="bt-button-primary w-full mt-6 py-3 text-center rounded-full text-xs tracking-[0.18em]"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Proceder al pago
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}