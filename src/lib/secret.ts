// src/lib/secret.ts
export const getEmployeeSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn("[getEmployeeSecret] ⚠️ JWT_SECRET no está definido en variables de entorno! Usando fallback inseguro.");
  } else {
    console.log(`[getEmployeeSecret] JWT_SECRET definido (longitud: ${secret.length})`);
  }
  return new TextEncoder().encode(secret || "fallback-secret-change-me");
};

export const getCustomerSecret = () => {
  const secret = process.env.JWT_CUSTOMER_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    console.warn("[getCustomerSecret] ⚠️ Ni JWT_CUSTOMER_SECRET ni JWT_SECRET están definidos! Usando fallback inseguro.");
  } else {
    const source = process.env.JWT_CUSTOMER_SECRET ? "JWT_CUSTOMER_SECRET" : "JWT_SECRET";
    console.log(`[getCustomerSecret] Usando secreto desde ${source} (longitud: ${secret.length})`);
  }
  return new TextEncoder().encode(secret || "fallback-secret-change-me");
};