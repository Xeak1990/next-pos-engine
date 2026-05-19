import { prisma } from "../../../../lib/prisma";
import { formatCurrency } from "../../../../lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: { orderId: string };
}

export default async function ConfirmationPage({ params }: Props) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="rounded-2xl border border-[#222222] bg-[#111111] p-8">
        <div className="mb-6 text-6xl">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-2">¡Gracias por tu compra!</h1>
        <p className="text-[#9CA3AF] mb-6">
          Tu pedido ha sido registrado con el número: <strong>{order.id}</strong>
        </p>

        <div className="text-left border-t border-[#333333] pt-6 mt-6">
          <h2 className="text-xl font-semibold text-white mb-4">Resumen del pedido</h2>
          {order.items.map((item: { id: string; name: string; quantity: number; price: number }) => (
            <div key={item.id} className="flex justify-between text-sm mb-2">
              <span>{item.name} x{item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-[#333333] mt-4 pt-4 flex justify-between font-bold text-white">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-[#E8621A] px-6 py-2 text-white hover:bg-[#c05210]"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}