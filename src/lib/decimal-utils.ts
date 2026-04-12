// src/lib/decimal-utils.ts
import { Decimal } from "decimal.js";

// Configuración para redondear como en los bancos (half-up)
Decimal.set({ precision: 20, rounding: 4 });

export const toDecimal = (value: string | number) => new Decimal(value);

export const formatCurrency = (value: Decimal) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value.toNumber());
};
