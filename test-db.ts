// test-db.ts
import { prisma } from "./src/lib/prisma";

async function test() {
  try {
    const stores = await prisma.store.findMany();
    console.log("--- CONEXIÓN EXITOSA ---");
    console.table(stores);
  } catch (e) {
    console.error("Error fatal:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
