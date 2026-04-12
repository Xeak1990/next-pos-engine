import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Decimal } from "decimal.js";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando el sembrado de datos...");

  const store = await prisma.store.upsert({
    where: { name: "Ben Tenison" },
    update: {},
    create: {
      name: "Ben Tenison",
      location: "Plaza Americas, Xalapa, Ver.",
    },
  });

  await prisma.product.create({
    data: {
      name: "Dunk low",
      brand: "Nike",
      description: "Edicion especial Retro",
      variants: {
        create: {
          sku: "NIKE-DUNK-BLU-28",
          size: "28", 
          color: "Azul/Blanco",
          price: new Decimal(2499.0),
          inventory: {
            create: {
              storeId: store.id,
              quantity: 15,
            },
          },
        },
      },
    },
  });

  console.log("Seed completado con éxito 👟");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });