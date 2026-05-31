import { PrismaClient, Role, Store } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateUpTo60DaysBack(now: Date): Date {
  const daysAgo = randomInt(0, 59);
  const target = new Date(now);
  target.setDate(now.getDate() - daysAgo);
  target.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59), 0);
  return target;
}

// --------------------------------------------------------------
// Generación de ventas con control de stock
// --------------------------------------------------------------
async function generateFakeSales(totalTarget: number = 50) {
  console.log(`🌱 Generando ${totalTarget} ventas controladas...`);

  const stores = await prisma.store.findMany();
  if (stores.length === 0) throw new Error("No hay sucursales");

  let variants = await prisma.variant.findMany({
    include: { inventory: true },
  });
  if (variants.length === 0) throw new Error("No hay variantes");

  const now = new Date();
  let salesCreated = 0;
  let hasTodaySale = false;
  const todayStr = now.toISOString().split('T')[0];

  for (let i = 0; i < totalTarget && salesCreated < totalTarget; i++) {
    const createdAt = randomDateUpTo60DaysBack(now);
    const store = stores[Math.floor(Math.random() * stores.length)];

    if (!hasTodaySale && createdAt.toISOString().split('T')[0] === todayStr) {
      hasTodaySale = true;
    }

    const availableVariants = variants.filter((v) => {
      const inv = v.inventory.find((i) => i.storeId === store.id);
      return inv && inv.quantity > 0;
    });

    if (availableVariants.length === 0) continue;

    const itemsCount = randomInt(1, 2);
    const selected = new Set<string>();
    const itemsData: {
      variantId: string;
      quantity: number;
      price: number;
      salePrice: number;
    }[] = [];
    let saleTotal = 0;

    for (let j = 0; j < itemsCount; j++) {
      let candidate;
      do {
        candidate = availableVariants[Math.floor(Math.random() * availableVariants.length)];
      } while (selected.has(candidate.id) && selected.size < availableVariants.length);
      selected.add(candidate.id);

      const quantity = 1;
      const price = Number(candidate.price);
      const discount = Math.random() < 0.2 ? randomInt(5, 15) / 100 : 0;
      const salePrice = Number((price * (1 - discount)).toFixed(2));
      const itemTotal = quantity * salePrice;
      saleTotal += itemTotal;

      const inventory = candidate.inventory.find((inv) => inv.storeId === store.id);
      if (!inventory || inventory.quantity < quantity) continue;

      itemsData.push({
        variantId: candidate.id,
        quantity,
        price,
        salePrice,
      });
    }

    if (itemsData.length === 0) continue;

    await prisma.$transaction(async (tx) => {
      await tx.sale.create({
        data: {
          storeId: store.id,
          total: saleTotal,
          createdAt,
          items: { create: itemsData },
        },
      });

      for (const item of itemsData) {
        await tx.inventory.updateMany({
          where: {
            storeId: store.id,
            variantId: item.variantId,
            quantity: { gte: item.quantity },
          },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    });

    salesCreated++;
    if (salesCreated % 10 === 0) {
      variants = await prisma.variant.findMany({ include: { inventory: true } });
    }
  }

  // Si no hay venta hoy, forzar una
  if (!hasTodaySale) {
    console.log("⚠️ No se generó venta hoy. Creando una forzada...");
    // Buscar una tienda con stock
    let storeWithStock = null;
    for (const store of stores) {
      const hasStock = variants.some(v => v.inventory.some(i => i.storeId === store.id && i.quantity > 0));
      if (hasStock) {
        storeWithStock = store;
        break;
      }
    }
    if (storeWithStock) {
      const variant = variants.find(v => v.inventory.some(i => i.storeId === storeWithStock!.id && i.quantity > 0));
      if (variant) {
        const quantity = 1;
        const price = Number(variant.price);
        const salePrice = price;
        await prisma.$transaction(async (tx) => {
          await tx.sale.create({
            data: {
              storeId: storeWithStock!.id,
              total: price,
              createdAt: now,
              items: {
                create: {
                  variantId: variant.id,
                  quantity,
                  price,
                  salePrice,
                },
              },
            },
          });
          await tx.inventory.updateMany({
            where: {
              storeId: storeWithStock!.id,
              variantId: variant.id,
              quantity: { gte: quantity },
            },
            data: { quantity: { decrement: quantity } },
          });
        });
        salesCreated++;
        console.log("✅ Venta forzada creada para hoy.");
      }
    }
  }

  console.log(`✅ Ventas generadas: ${salesCreated} (de ${totalTarget} intentos)`);
}

// --------------------------------------------------------------
// LIMPIEZA PROFUNDA
// --------------------------------------------------------------
async function cleanDatabase() {
  console.log("🧹 Limpiando datos existentes...");
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  // No se borran categorías, usuarios ni tiendas
}

// --------------------------------------------------------------
// MAIN
// --------------------------------------------------------------
async function main() {
  console.log("🌱 Iniciando seed...");

  const plainPasswordStaff = process.env.SEED_PASSWORD || "XZNRXNJTESGAQA";
  const staffPass = await hashPassword(plainPasswordStaff);

  await cleanDatabase();

  const calzadoCat = await prisma.category.upsert({
    where: { slug: "calzado" },
    update: {},
    create: { name: "Calzado", slug: "calzado" },
  });

  const storesData = [
    { name: "Centro Xalapa", location: "Enriquez #10, Centro Histórico" },
    { name: "Plaza Américas", location: "Carr. Xalapa-Veracruz Km 2" },
    { name: "Plaza Crystal", location: "Av. Lázaro Cárdenas, Col. Crystal" },
    { name: "Plaza Museo", location: "Av. 20 de Noviembre, Zona Centro" },
    { name: "Plaza Ánimas", location: "Blvd. Ánimas, Col. Ánimas" },
  ];

  const stores: Store[] = [];
  for (const s of storesData) {
    const store = await prisma.store.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
    stores.push(store);
  }

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@bentenison.mx" },
    update: { password: staffPass },
    create: {
      name: "Administrador Global",
      email: "admin@bentenison.mx",
      password: staffPass,
      role: Role.ADMIN,
      storeId: null,
    },
  });

  // Gerentes
  for (const store of stores) {
    const managerEmail = `gerente.${store.name.toLowerCase().replace(/\s/g, "")}@bentenison.mx`;
    await prisma.user.upsert({
      where: { email: managerEmail },
      update: { password: staffPass },
      create: {
        name: `Gerente ${store.name}`,
        email: managerEmail,
        password: staffPass,
        role: Role.MANAGER,
        storeId: store.id,
      },
    });
  }

  // Cajeros
  for (const store of stores) {
    const num = randomInt(1, 3);
    for (let i = 1; i <= num; i++) {
      const cashierEmail = `cajero${i}.${store.name.toLowerCase().replace(/\s/g, "")}@bentenison.mx`;
      await prisma.user.upsert({
        where: { email: cashierEmail },
        update: { password: staffPass },
        create: {
          name: `Cajero ${i} - ${store.name}`,
          email: cashierEmail,
          password: staffPass,
          role: Role.CASHIER,
          storeId: store.id,
        },
      });
    }
  }

  // Productos y variantes
  const productsData = [
    { name: "Dunk Low", brand: "Nike", basePrice: 2499, skuPrefix: "NIKE-DUNK" },
    { name: "Stan Smith", brand: "Adidas", basePrice: 2199, skuPrefix: "AD-STAN" },
    { name: "Jordan 1 Mid", brand: "Jordan", basePrice: 3299, skuPrefix: "JO-MID" },
    { name: "RS-X", brand: "Puma", basePrice: 1899, skuPrefix: "PUMA-RSX" },
    { name: "574", brand: "New Balance", basePrice: 1799, skuPrefix: "NB-574" },
    { name: "Chuck Taylor", brand: "Converse", basePrice: 1299, skuPrefix: "CONV-CHUCK" },
  ];

  const sizes = ["25", "26", "27", "28", "29", "30", "31"];

  for (const p of productsData) {
    await prisma.product.create({
      data: {
        name: p.name,
        brand: p.brand,
        categoryId: calzadoCat.id,
        variants: {
          create: sizes.map((size) => ({
            sku: `${p.skuPrefix}-${size}`,
            size,
            color: "Original",
            price: p.basePrice,
            inventory: {
              create: stores.map((store) => ({
                storeId: store.id,
                quantity: randomInt(15, 30),
              })),
            },
          })),
        },
      },
    });
  }

  const ventasObjetivo = randomInt(45, 55);
  await generateFakeSales(ventasObjetivo);

  console.log("✅ Seed completado exitosamente.");
  console.log(`🔑 Contraseña utilizada para todos los usuarios internos: ${plainPasswordStaff}`);
  console.log("   Admin:      admin@bentenison.mx");
  console.log("   Gerentes:   gerente.<sucursal>@bentenison.mx");
  console.log("   Cajeros:    cajero<1-3>.<sucursal>@bentenison.mx");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Error en seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });