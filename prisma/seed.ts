import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Iniciando el sembrado de datos...");

  // Crear sucursales
  const centroStore = await prisma.store.upsert({
    where: { name: "Centro Xalapa" },
    update: {},
    create: {
      name: "Centro Xalapa",
      location: "Centro Histórico, Xalapa, Ver.",
    },
  });

  const plazaAmericasStore = await prisma.store.upsert({
    where: { name: "Plaza Américas" },
    update: {},
    create: {
      name: "Plaza Américas",
      location: "Plaza Américas, Xalapa, Ver.",
    },
  });

  // Sucursal faltante: Plaza Crystal
  const plazaCrystalStore = await prisma.store.upsert({
    where: { name: "Plaza Crystal" },
    update: {},
    create: {
      name: "Plaza Crystal",
      location: "Plaza Crystal, Xalapa, Ver.",
    },
  });

  console.log("Sucursales creadas:", centroStore.name, plazaAmericasStore.name, plazaCrystalStore.name);

  // Contraseña común
  const hashedPassword = await hashPassword("1234");

  // Usuarios existentes
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@bentenison.mx" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@bentenison.mx",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  const managerCentro = await prisma.user.upsert({
    where: { email: "gerente@bentenison.mx" },
    update: {},
    create: {
      name: "Gerente Centro",
      email: "gerente@bentenison.mx",
      password: hashedPassword,
      role: "MANAGER",
      storeId: centroStore.id,
      isActive: true,
    },
  });

  const cashierPlaza = await prisma.user.upsert({
    where: { email: "cajero@bentenison.mx" },
    update: {},
    create: {
      name: "Cajero Plaza",
      email: "cajero@bentenison.mx",
      password: hashedPassword,
      role: "CASHIER",
      storeId: plazaAmericasStore.id,
      isActive: true,
    },
  });

  // Nuevo personal para Plaza Crystal
  const managerCrystal = await prisma.user.upsert({
    where: { email: "gerente.crystal@bentenison.mx" },
    update: {},
    create: {
      name: "Gerente Crystal",
      email: "gerente.crystal@bentenison.mx",
      password: hashedPassword,
      role: "MANAGER",
      storeId: plazaCrystalStore.id,
      isActive: true,
    },
  });

  const cashierCrystal = await prisma.user.upsert({
    where: { email: "cajero.crystal@bentenison.mx" },
    update: {},
    create: {
      name: "Cajero Crystal",
      email: "cajero.crystal@bentenison.mx",
      password: hashedPassword,
      role: "CASHIER",
      storeId: plazaCrystalStore.id,
      isActive: true,
    },
  });

  // Un cajero adicional para Centro Xalapa
  const cashierCentro2 = await prisma.user.upsert({
    where: { email: "cajero.centro2@bentenison.mx" },
    update: {},
    create: {
      name: "Cajero Centro",
      email: "cajero.centro2@bentenison.mx",
      password: hashedPassword,
      role: "CASHIER",
      storeId: centroStore.id,
      isActive: true,
    },
  });

  console.log("Usuarios creados:", adminUser.name, managerCentro.name, cashierPlaza.name, managerCrystal.name, cashierCrystal.name, cashierCentro2.name);

  // Productos con variantes (algunas incompletas) y precios variables
  const products = [
    {
      name: "Dunk Low",
      brand: "Nike",
      description: "Edición especial Retro",
      variants: [
        { sku: "NIKE-DUNK-BLU-24", size: "24", color: "Azul/Blanco", price: 2499.0 },
        { sku: "NIKE-DUNK-BLU-25", size: "25", color: "Azul/Blanco", price: 2499.0 },
        { sku: "NIKE-DUNK-BLU-26", size: "26", color: "Azul/Blanco", price: 2499.0 },
        { sku: "NIKE-DUNK-BLU-27", size: "27", color: "Azul/Blanco", price: 2499.0 },
        { sku: "NIKE-DUNK-BLU-28", size: "28", color: "Azul/Blanco", price: 2499.0 },
      ],
      inventoryDistribution: "all", // disponible en todas las sucursales
    },
    {
      name: "Stan Smith",
      brand: "Adidas",
      description: "Clásico atemporal",
      variants: [
        { sku: "ADIDAS-STAN-WHT-24", size: "24", color: "Blanco/Verde", price: 2199.0 },
        { sku: "ADIDAS-STAN-WHT-25", size: "25", color: "Blanco/Verde", price: 2199.0 },
        { sku: "ADIDAS-STAN-WHT-26", size: "26", color: "Blanco/Verde", price: 2199.0 },
        { sku: "ADIDAS-STAN-WHT-27", size: "27", color: "Blanco/Verde", price: 2199.0 },
        { sku: "ADIDAS-STAN-WHT-28", size: "28", color: "Blanco/Verde", price: 2199.0 },
      ],
      inventoryDistribution: "all",
    },
    {
      name: "574",
      brand: "New Balance",
      description: "Estilo retro clásico",
      variants: [
        { sku: "NB-574-GRY-24", size: "24", color: "Gris/Naranja", price: 2299.0 },
        { sku: "NB-574-GRY-25", size: "25", color: "Gris/Naranja", price: 2299.0 },
        { sku: "NB-574-GRY-26", size: "26", color: "Gris/Naranja", price: 2299.0 },
        { sku: "NB-574-GRY-27", size: "27", color: "Gris/Naranja", price: 2299.0 },
        { sku: "NB-574-GRY-28", size: "28", color: "Gris/Naranja", price: 2299.0 },
      ],
      inventoryDistribution: "all",
    },
    {
      name: "RS-X",
      brand: "Puma",
      description: "Diseño futurista chunky",
      variants: [
        { sku: "PUMA-RSX-BLK-24", size: "24", color: "Negro/Plateado", price: 2399.0 },
        { sku: "PUMA-RSX-BLK-25", size: "25", color: "Negro/Plateado", price: 2399.0 },
        { sku: "PUMA-RSX-BLK-26", size: "26", color: "Negro/Plateado", price: 2399.0 },
        { sku: "PUMA-RSX-BLK-27", size: "27", color: "Negro/Plateado", price: 2399.0 },
        { sku: "PUMA-RSX-BLK-28", size: "28", color: "Negro/Plateado", price: 2399.0 },
      ],
      inventoryDistribution: "all",
    },
    // Nuevos productos con tallas faltantes y precios distintos
    {
      name: "Air Force 1",
      brand: "Nike",
      description: "Clásico blanco",
      variants: [
        { sku: "NIKE-AF1-WHT-24", size: "24", color: "Blanco/Blanco", price: 2899.0 },
        { sku: "NIKE-AF1-WHT-25", size: "25", color: "Blanco/Blanco", price: 2899.0 },
        { sku: "NIKE-AF1-WHT-26", size: "26", color: "Blanco/Blanco", price: 2899.0 },
        // faltan tallas 27 y 28
      ],
      inventoryDistribution: "centro_and_plaza", // solo en Centro y Plaza Américas
    },
    {
      name: "Jordan 1 Mid",
      brand: "Jordan",
      description: "Estilo urbano",
      variants: [
        { sku: "JORDAN-MID-BLK-25", size: "25", color: "Negro/Rojo", price: 3299.0 },
        { sku: "JORDAN-MID-BLK-26", size: "26", color: "Negro/Rojo", price: 3299.0 },
        { sku: "JORDAN-MID-BLK-27", size: "27", color: "Negro/Rojo", price: 3299.0 },
        { sku: "JORDAN-MID-BLK-28", size: "28", color: "Negro/Rojo", price: 3299.0 },
        // falta talla 24
      ],
      inventoryDistribution: "crystal_only", // solo en Plaza Crystal
    },
    {
      name: "Old Skool",
      brand: "Vans",
      description: "Skate clásico",
      variants: [
        { sku: "VANS-OLD-BLK-24", size: "24", color: "Negro/Blanco", price: 1499.0 },
        { sku: "VANS-OLD-BLK-25", size: "25", color: "Negro/Blanco", price: 1499.0 },
        { sku: "VANS-OLD-BLK-26", size: "26", color: "Negro/Blanco", price: 1499.0 },
        { sku: "VANS-OLD-BLK-27", size: "27", color: "Negro/Blanco", price: 1499.0 },
        // falta talla 28
      ],
      inventoryDistribution: "all_except_crystal", // todas menos Plaza Crystal
    },
  ];

  // Helper para asignar inventario según la distribución
  function getStoresForDistribution(
    dist: string,
    centroId: string,
    plazaId: string,
    crystalId: string
  ): { storeId: string; quantity: number }[] {
    const stores: { storeId: string; quantity: number }[] = [];
    const randomQty = () => Math.floor(Math.random() * 20) + 5; // 5-24

    if (dist === "all") {
      stores.push(
        { storeId: centroId, quantity: randomQty() },
        { storeId: plazaId, quantity: randomQty() },
        { storeId: crystalId, quantity: randomQty() }
      );
    } else if (dist === "centro_and_plaza") {
      stores.push(
        { storeId: centroId, quantity: randomQty() },
        { storeId: plazaId, quantity: randomQty() }
      );
    } else if (dist === "crystal_only") {
      stores.push({ storeId: crystalId, quantity: randomQty() });
    } else if (dist === "all_except_crystal") {
      stores.push(
        { storeId: centroId, quantity: randomQty() },
        { storeId: plazaId, quantity: randomQty() }
      );
    }
    return stores;
  }

  for (const productData of products) {
    let product = await prisma.product.findFirst({
      where: { name: productData.name, brand: productData.brand },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: productData.name,
          brand: productData.brand,
          description: productData.description,
          variants: {
            create: productData.variants.map((variant) => {
              const storeList = getStoresForDistribution(
                productData.inventoryDistribution,
                centroStore.id,
                plazaAmericasStore.id,
                plazaCrystalStore.id
              );
              return {
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                price: variant.price,
                inventory: {
                  create: storeList.map((s) => ({
                    storeId: s.storeId,
                    quantity: s.quantity,
                  })),
                },
              };
            }),
          },
        },
      });
      console.log(`Producto creado: ${product.name} (${product.brand})`);
    } else {
      console.log(`Producto ya existente: ${product.name} (${product.brand})`);
    }
  }

  // Cliente demo
  const demoCustomer = await prisma.customer.upsert({
    where: { email: "cliente@bentenison.mx" },
    update: {},
    create: {
      email: "cliente@bentenison.mx",
      password: await hashPassword("cliente123"),
      name: "Cliente Demo",
      phone: "555-1234",
      address: "Av. Principal 123",
      city: "Xalapa",
      postalCode: "91000",
    },
  });
  console.log("Cliente demo creado:", demoCustomer.email);

  console.log("Seed completado con éxito 👟");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });