// src/types/index.ts
export interface Store {
  id: string;
  name: string;
  location: string;
}

export interface Inventory {
  quantity: number;
  store: Store;
}

export interface Variant {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: string | number; // String para evitar errores de serialización Decimal
  inventory: Inventory[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  variants: Variant[];
}