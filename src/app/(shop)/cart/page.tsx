"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartWeb } from "../../../context/CartContextWeb";
import { formatCurrency } from "../../../lib/utils";

export default function CartPage() {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } =
    useCartWeb();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-xl text-white">Tu carrito está vacío</p>
        <Link
          href="/"
          className="mt-4 rounded-full bg-[#E8621A] px-6 py-2 text-sm font-semibold text-white"
        >
          Seguir comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold text-white mb-8">Carrito de compras</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Lista de productos */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex flex-col sm:flex-row gap-4 border-b border-[#222222] pb-4"
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
                  <span className="text-4xl">📦</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{item.name}</h3>
                {item.size && (
                  <p className="text-sm text-[#9CA3AF]">Talla: {item.size}</p>
                )}
                <p className="mt-1 font-mono text-[#E8621A]">
                  {formatCurrency(item.price)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md border border-[#333333]">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="px-3 py-1 text-white hover:bg-[#333333]"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="px-3 py-1 text-white hover:bg-[#333333]"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-[#9CA3AF] hover:text-[#E8621A]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-4">
            <button
              onClick={clearCart}
              className="text-sm text-[#9CA3AF] hover:text-white"
            >
              Vaciar carrito
            </button>
            <Link href="/" className="text-sm text-[#E8621A] hover:underline">
              Seguir comprando
            </Link>
          </div>
        </div>

        {/* Resumen */}
        <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6 h-fit">
          <h2 className="text-xl font-bold text-white mb-4">Resumen</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span>Calculado al pagar</span>
            </div>
            <div className="border-t border-[#333333] pt-2 mt-2">
              <div className="flex justify-between font-bold text-white">
                <span>Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
          <Link
            href="/checkout"
            className="mt-6 w-full rounded-full bg-[#E8621A] py-3 text-center font-semibold text-white hover:bg-[#c05210] transition-colors"
          >
            Proceder al pago
          </Link>
        </div>
      </div>
    </div>
  );
}
