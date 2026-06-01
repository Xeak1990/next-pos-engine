// src/lib/secret.ts
export const getEmployeeSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);
export const getCustomerSecret = () => new TextEncoder().encode(process.env.JWT_CUSTOMER_SECRET || process.env.JWT_SECRET!);