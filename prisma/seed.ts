import { PrismaClient, Role, Store, Variant, Inventory } from "@prisma/client";
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
// Generación de ventas (optimizada, en lotes)
// --------------------------------------------------------------
async function generateFakeSales(totalTarget: number = 50) {
  console.log(`🌱 Generando ${totalTarget} ventas en modo paralelo controlado...`);

  const stores = await prisma.store.findMany();
  if (stores.length === 0) throw new Error("No hay sucursales");

  const variants = await prisma.variant.findMany({
    include: { inventory: true },
  });
  if (variants.length === 0) throw new Error("No hay variantes");

  // Mapa de inventario en memoria (stock inicial)
  const inventoryMap = new Map<string, number>();
  for (const variant of variants) {
    for (const inv of variant.inventory) {
      inventoryMap.set(`${inv.storeId}-${variant.id}`, inv.quantity);
    }
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  let hasTodaySale = false;

  const salesToCreate: Array<{
    storeId: string;
    total: number;
    createdAt: Date;
    items: Array<{
      variantId: string;
      quantity: number;
      price: number;
      salePrice: number;
    }>;
  }> = [];

  let attempts = 0;
  const maxAttempts = totalTarget * 3;

  while (salesToCreate.length < totalTarget && attempts < maxAttempts) {
    attempts++;
    const store = stores[Math.floor(Math.random() * stores.length)];
    const createdAt = randomDateUpTo60DaysBack(now);

    if (!hasTodaySale && createdAt.toISOString().split('T')[0] === todayStr) {
      hasTodaySale = true;
    }

    const availableVariants = variants.filter((v: Variant) => {
      const stock = inventoryMap.get(`${store.id}-${v.id}`);
      return stock !== undefined && stock > 0;
    });

    if (availableVariants.length === 0) continue;

    const itemsCount = randomInt(1, 2);
    const selected = new Set<string>();
    const itemsData: Array<{
      variantId: string;
      quantity: number;
      price: number;
      salePrice: number;
    }> = [];
    let saleTotal = 0;
    let validSale = true;

    for (let j = 0; j < itemsCount; j++) {
      let candidate: Variant;
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

      const currentStock = inventoryMap.get(`${store.id}-${candidate.id}`);
      if (!currentStock || currentStock < quantity) {
        validSale = false;
        break;
      }

      inventoryMap.set(`${store.id}-${candidate.id}`, currentStock - quantity);
      itemsData.push({
        variantId: candidate.id,
        quantity,
        price,
        salePrice,
      });
    }

    if (!validSale || itemsData.length === 0) {
      // Revertir cambios de inventario en memoria para esta venta fallida
      for (const item of itemsData) {
        const key = `${store.id}-${item.variantId}`;
        const current = inventoryMap.get(key) || 0;
        inventoryMap.set(key, current + item.quantity);
      }
      continue;
    }

    salesToCreate.push({
      storeId: store.id,
      total: saleTotal,
      createdAt,
      items: itemsData,
    });
  }

  // Forzar venta hoy si no existe
  if (!hasTodaySale) {
    console.log("⚠️ No se generó venta hoy. Creando una forzada...");
    let storeWithStock: Store | null = null;
    let variantWithStock: Variant | null = null;
    for (const store of stores) {
      for (const variant of variants) {
        const stock = inventoryMap.get(`${store.id}-${variant.id}`);
        if (stock && stock > 0) {
          storeWithStock = store;
          variantWithStock = variant;
          break;
        }
      }
      if (storeWithStock) break;
    }
    if (storeWithStock && variantWithStock) {
      const quantity = 1;
      const price = Number(variantWithStock.price);
      const salePrice = price;
      const saleTotal = price;
      const currentStock = inventoryMap.get(`${storeWithStock.id}-${variantWithStock.id}`)!;
      inventoryMap.set(`${storeWithStock.id}-${variantWithStock.id}`, currentStock - quantity);
      salesToCreate.push({
        storeId: storeWithStock.id,
        total: saleTotal,
        createdAt: now,
        items: [{ variantId: variantWithStock.id, quantity, price, salePrice }],
      });
      console.log("✅ Venta forzada agregada al lote.");
    } else {
      console.warn("⚠️ No se pudo crear venta forzada: sin stock.");
    }
  }

  console.log(`📦 Preparadas ${salesToCreate.length} ventas. Insertando en lotes de 10...`);

  // Insertar en lotes
  const BATCH_SIZE = 10;
  for (let i = 0; i < salesToCreate.length; i += BATCH_SIZE) {
    const batch = salesToCreate.slice(i, i + BATCH_SIZE);
    const promises = batch.map((sale) =>
      prisma.sale.create({
        data: {
          storeId: sale.storeId,
          total: sale.total,
          createdAt: sale.createdAt,
          items: {
            create: sale.items,
          },
        },
      })
    );
    await Promise.all(promises);
    console.log(`✅ Lote ${Math.floor(i / BATCH_SIZE) + 1} completado (${batch.length} ventas).`);
  }

  // Actualizar inventario final en lotes
  const allInventory = await prisma.inventory.findMany();
  const updates = allInventory
    .map((inv: Inventory) => {
      const key = `${inv.storeId}-${inv.variantId}`;
      const newQuantity = inventoryMap.get(key);
      if (newQuantity !== undefined && newQuantity !== inv.quantity) {
        return { id: inv.id, quantity: newQuantity };
      }
      return null;
    })
    .filter((upd): upd is { id: string; quantity: number } => upd !== null);

  if (updates.length > 0) {
    console.log(`📦 Actualizando ${updates.length} registros de inventario en lotes...`);
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      const updatePromises = batch.map((upd) =>
        prisma.inventory.update({
          where: { id: upd.id },
          data: { quantity: upd.quantity },
        })
      );
      await Promise.all(updatePromises);
      console.log(`✅ Lote de inventario ${Math.floor(i / BATCH_SIZE) + 1} completado.`);
    }
  }

  console.log(`✅ Ventas generadas: ${salesToCreate.length} (de ${totalTarget} intentos)`);
}

// --------------------------------------------------------------
// LIMPIEZA PROFUNDA (orden correcto: hijos → padres)
// --------------------------------------------------------------
async function cleanDatabase() {
  console.log("🧹 Limpiando datos existentes...");
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  // No se borran categorías, usuarios, clientes ni tiendas
}

// --------------------------------------------------------------
// MAIN
// --------------------------------------------------------------
async function main() {
  console.log("🌱 Iniciando seed...");

  const plainPasswordStaff = process.env.SEED_PASSWORD || "XZNRXNJTESGAQA";
  const staffPass = await hashPassword(plainPasswordStaff);

  // 1. Limpieza completa de datos transaccionales
  await cleanDatabase();

  // 2. Categoría base
  const calzadoCat = await prisma.category.upsert({
    where: { slug: "calzado" },
    update: {},
    create: { name: "Calzado", slug: "calzado" },
  });

  // 3. Sucursales
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

  // 4. Usuarios internos (admin, gerentes, cajeros)
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

  // 5. Usuario cliente de prueba (modelo Customer)
  const testCustomerPassword = "password123";
  const hashedCustomerPassword = await hashPassword(testCustomerPassword);
  await prisma.customer.upsert({
    where: { email: "test.customer@gmail.com" },
    update: { password: hashedCustomerPassword },
    create: {
      email: "test.customer@gmail.com",
      password: hashedCustomerPassword,
      name: "Cliente de Prueba",
      phone: null,
      address: null,
      city: null,
      postalCode: null,
    },
  });

  // 6. Productos y variantes (recrea inventario desde cero)
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

  // 7. Generar ventas ficticias
  const ventasObjetivo = randomInt(45, 55);
  await generateFakeSales(ventasObjetivo);

  console.log("✅ Seed completado exitosamente.");
  console.log(`🔑 Contraseña para usuarios internos: ${plainPasswordStaff}`);
  console.log(`🔑 Contraseña para cliente de prueba (test.customer@gmail.com): ${testCustomerPassword}`);
  console.log("   Admin:      admin@bentenison.mx");
  console.log("   Gerentes:   gerente.<sucursal>@bentenison.mx");
  console.log("   Cajeros:    cajero<1-3>.<sucursal>@bentenison.mx");
  console.log("   Cliente:    test.customer@gmail.com");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Error en seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });