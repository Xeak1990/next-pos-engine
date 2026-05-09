import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Decimal } from "decimal.js";
import pg from "pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

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

  const plazaStore = await prisma.store.upsert({
    where: { name: "Plaza Américas" },
    update: {},
    create: {
      name: "Plaza Américas",
      location: "Plaza Américas, Xalapa, Ver.",
    },
  });

  console.log("Sucursales creadas:", centroStore.name, plazaStore.name);

  // Crear usuarios con contraseñas hasheadas
  const hashedPassword = await hashPassword("1234");

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

  const managerUser = await prisma.user.upsert({
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

  const cashierUser = await prisma.user.upsert({
    where: { email: "cajero@bentenison.mx" },
    update: {},
    create: {
      name: "Cajero Plaza",
      email: "cajero@bentenison.mx",
      password: hashedPassword,
      role: "CASHIER",
      storeId: plazaStore.id,
      isActive: true,
    },
  });

  console.log("Usuarios creados:", adminUser.name, managerUser.name, cashierUser.name);

  // Productos con variantes y stock distribuido
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
    },
  ];

  for (const productData of products) {
    let product = await prisma.product.findFirst({
      where: { name: productData.name },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: productData.name,
          brand: productData.brand,
          description: productData.description,
          variants: {
            create: productData.variants.map((variant) => ({
              sku: variant.sku,
              size: variant.size,
              color: variant.color,
              price: new Decimal(variant.price),
              inventory: {
                create: [
                  {
                    storeId: centroStore.id,
                    quantity: Math.floor(Math.random() * 20) + 5, // Stock aleatorio 5-25
                  },
                  {
                    storeId: plazaStore.id,
                    quantity: Math.floor(Math.random() * 20) + 5, // Stock aleatorio 5-25
                  },
                ],
              },
            })),
          },
        },
      });
    }

    console.log(`Producto creado/verificado: ${product.name} (${product.brand})`);
  }

  console.log("Seed completado con éxito 👟");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });