"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar");
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al registrar";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] px-4">
      <div className="max-w-md w-full bt-panel p-8 rounded-2xl">
        <h1 className="text-3xl font-bold text-white mb-6">Crear cuenta</h1>
        {error && (
          <div className="bg-red-500/20 text-red-500 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre completo *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 rounded-lg bg-[#1A1A1A] border border-[#333] text-white"
            required
          />
          <input
            type="email"
            placeholder="Correo electrónico *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-3 rounded-lg bg-[#1A1A1A] border border-[#333] text-white"
            required
          />
          <input
            type="password"
            placeholder="Contraseña *"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-3 rounded-lg bg-[#1A1A1A] border border-[#333] text-white"
            required
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full p-3 rounded-lg bg-[#1A1A1A] border border-[#333] text-white"
          />
          <input
            type="text"
            placeholder="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full p-3 rounded-lg bg-[#1A1A1A] border border-[#333] text-white"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Ciudad"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full p-3 rounded-lg bg-[#1A1A1A] border border-[#333] text-white"
            />
            <input
              type="text"
              placeholder="Código postal"
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              className="w-full p-3 rounded-lg bg-[#1A1A1A] border border-[#333] text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bt-button-primary py-3 text-white rounded-full disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>
        <p className="text-center text-[#9CA3AF] mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-[#E8621A] hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
