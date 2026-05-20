import { prisma } from "../../lib/prisma";
import CatalogClient from "./CatalogClient";
import { Product } from "../../types";
import { Prisma } from "@prisma/client";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    variants: {
      include: {
        inventory: { include: { store: true } };
      };
    };
  };
}>;

// ✅ Definir tipo para filterOptions
interface FilterOptions {
  stores: string[];
  categories: string[];
  sizes: string[];
}

export default async function ShopPage() {
  let serializedProducts: Product[] = [];
  let filterOptions: FilterOptions = { stores: [], categories: [], sizes: [] }; // ✅ tipado explícito

  try {
    const productsFromDb = (await prisma.product.findMany({
      include: {
        variants: {
          include: {
            inventory: { include: { store: true } },
          },
        },
      },
    })) as ProductWithRelations[];

    serializedProducts = productsFromDb.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        price: v.price.toString(),
        inventory: v.inventory.map((i) => ({
          quantity: i.quantity,
          store: {
            id: i.store.id,
            name: i.store.name,
            location: i.store.location,
          },
        })),
      })),
    }));

    const storesSet = new Set<string>();
    const categoriesSet = new Set<string>();
    const sizesSet = new Set<string>();

    for (const product of serializedProducts) {
      categoriesSet.add(product.category);
      for (const variant of product.variants) {
        sizesSet.add(variant.size);
        for (const inv of variant.inventory) {
          storesSet.add(inv.store.name);
        }
      }
    }

    filterOptions = {
      stores: Array.from(storesSet).sort(),
      categories: Array.from(categoriesSet).sort(),
      sizes: Array.from(sizesSet).sort((a, b) => {
        const an = parseInt(a);
        const bn = parseInt(b);
        if (!isNaN(an) && !isNaN(bn)) return an - bn;
        return a.localeCompare(b);
      }),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 text-white">
      {" "}
      {/* ← sin min-h-screen */}
      <header className="mb-10">...</header>
      <CatalogClient
        initialProducts={serializedProducts}
        filterOptions={filterOptions}
      />
    </div>
  );
}
