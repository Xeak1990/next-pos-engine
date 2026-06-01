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

// Distribución uniforme en los últimos 60 días (incluye hoy)
function randomDateUpTo60DaysBack(now: Date): Date {
  const daysAgo = randomInt(0, 59); // 0 = hoy, 59 = hace 60 días
  const target = new Date(now);
  target.setDate(now.getDate() - daysAgo);
  target.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59), 0);
  return target;
}

// --------------------------------------------------------------
// Generación de ventas (abundantes y con cobertura diaria)
// --------------------------------------------------------------
async function generateFakeSales(totalTarget: number = 80) {
  console.log(`🌱 Generando ${totalTarget} ventas distribuidas en los últimos 60 días...`);

  const stores = await prisma.store.findMany();
  if (stores.length === 0) throw new Error("No hay sucursales");

  const variants = await prisma.variant.findMany({
    include: { inventory: true },
  });
  if (variants.length === 0) throw new Error("No hay variantes");

  // Mapa de inventario en memoria
  const inventoryMap = new Map<string, number>();
  for (const variant of variants) {
    for (const inv of variant.inventory) {
      inventoryMap.set(`${inv.storeId}-${variant.id}`, inv.quantity);
    }
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  let todaySalesCount = 0;

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

  // 1. Generar ventas aleatorias (uniforme en días)
  while (salesToCreate.length < totalTarget && attempts < maxAttempts) {
    attempts++;
    const store = stores[Math.floor(Math.random() * stores.length)];
    const createdAt = randomDateUpTo60DaysBack(now);

    const isToday = createdAt.toISOString().split('T')[0] === todayStr;
    if (isToday) todaySalesCount++;

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

  // 2. Forzar al menos una venta por día en el mes actual (desde el día 1 hasta hoy)
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const today = new Date(currentYear, currentMonth - 1, now.getDate());
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  console.log(`🌱 Asegurando al menos una venta por día en ${currentYear}-${currentMonth}...`);
  for (let d = 1; d <= daysInMonth; d++) {
    const targetDate = new Date(currentYear, currentMonth - 1, d);
    if (targetDate > today) break; // no forzar días futuros

    // Verificar si ya hay alguna venta en ese día
    const alreadyHasSale = salesToCreate.some(sale => {
      const saleDay = sale.createdAt.getDate();
      const saleMonth = sale.createdAt.getMonth() + 1;
      const saleYear = sale.createdAt.getFullYear();
      return saleDay === d && saleMonth === currentMonth && saleYear === currentYear;
    });

    if (!alreadyHasSale) {
      // Buscar una tienda y variante con stock
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
        // Crear la venta a las 12:00 (para variar un poco)
        const forcedDate = new Date(targetDate);
        forcedDate.setHours(12, 0, 0, 0);
        salesToCreate.push({
          storeId: storeWithStock.id,
          total: saleTotal,
          createdAt: forcedDate,
          items: [{ variantId: variantWithStock.id, quantity, price, salePrice }],
        });
        console.log(`✅ Venta forzada para el día ${d}/${currentMonth}/${currentYear}`);
      } else {
        console.warn(`⚠️ No se pudo forzar venta para el día ${d}/${currentMonth}/${currentYear}: sin stock.`);
      }
    }
  }

  // 3. Forzar entre 2 y 3 ventas hoy (si no se alcanzaron)
  const minTodaySales = randomInt(2, 3);
  if (todaySalesCount < minTodaySales) {
    console.log(`⚠️ Solo ${todaySalesCount} ventas generadas hoy. Forzando ${minTodaySales - todaySalesCount} venta(s) adicional(es)...`);
    let forced = 0;
    for (const store of stores) {
      if (forced >= minTodaySales - todaySalesCount) break;
      for (const variant of variants) {
        const stock = inventoryMap.get(`${store.id}-${variant.id}`);
        if (stock && stock > 0) {
          const quantity = 1;
          const price = Number(variant.price);
          const salePrice = price;
          const saleTotal = price;
          const currentStock = inventoryMap.get(`${store.id}-${variant.id}`)!;
          inventoryMap.set(`${store.id}-${variant.id}`, currentStock - quantity);
          salesToCreate.push({
            storeId: store.id,
            total: saleTotal,
            createdAt: now,
            items: [{ variantId: variant.id, quantity, price, salePrice }],
          });
          forced++;
          if (forced >= minTodaySales - todaySalesCount) break;
        }
      }
    }
    console.log(`✅ Forzadas ${forced} venta(s) para hoy.`);
  } else {
    console.log(`✅ Ya hay ${todaySalesCount} ventas hoy.`);
  }

  console.log(`📦 Preparadas ${salesToCreate.length} ventas. Insertando una por una (secuencial)...`);

  // Insertar ventas secuencialmente (una tras otra) para evitar saturar conexiones
  for (const sale of salesToCreate) {
    await prisma.sale.create({
      data: {
        storeId: sale.storeId,
        total: sale.total,
        createdAt: sale.createdAt,
        items: {
          create: sale.items,
        },
      },
    });
  }

  console.log(`✅ Ventas insertadas: ${salesToCreate.length}`);

  // Actualizar inventario final secuencialmente
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
    console.log(`📦 Actualizando ${updates.length} registros de inventario secuencialmente...`);
    for (const upd of updates) {
      await prisma.inventory.update({
        where: { id: upd.id },
        data: { quantity: upd.quantity },
      });
    }
    console.log("✅ Inventario actualizado.");
  }

  console.log(`✅ Ventas generadas: ${salesToCreate.length} (objetivo: ${totalTarget})`);
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
  // No se borran categorías, usuarios, clientes ni tiendas
}

// --------------------------------------------------------------
// MAIN
// --------------------------------------------------------------
async function main() {
  console.log("🌱 Iniciando seed...");

  const plainPasswordStaff = process.env.SEED_PASSWORD || "XZNRXNJTESGAQA";
  const staffPass = await hashPassword(plainPasswordStaff);

  await cleanDatabase();

  // Crear categorías variadas
  const categoriesData = [
    { name: "Casual", slug: "casual" },
    { name: "Deportivo", slug: "deportivo" },
    { name: "Bota", slug: "bota" },
    { name: "Retro/Vintage", slug: "retro-vintage" },
    { name: "Yeezy", slug: "yeezy" },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug },
    });
    categories.push(category);
  }

  // Sucursales
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

  // Usuarios internos
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

  // Cliente de prueba con datos completos
  const testCustomerPassword = "password123";
  const hashedCustomerPassword = await hashPassword(testCustomerPassword);
  await prisma.customer.upsert({
    where: { email: "test.customer@gmail.com" },
    update: { password: hashedCustomerPassword },
    create: {
      email: "test.customer@gmail.com",
      password: hashedCustomerPassword,
      name: "Cliente de Prueba",
      phone: "2281234567",
      address: "Av. Xalapa 123, Centro",
      city: "Xalapa",
      postalCode: "91000",
    },
  });

  // Productos y variantes con categorías aleatorias
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
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    await prisma.product.create({
      data: {
        name: p.name,
        brand: p.brand,
        categoryId: randomCategory.id,
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

  // Generar ventas (entre 80 y 100)
  const ventasObjetivo = randomInt(80, 100);
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