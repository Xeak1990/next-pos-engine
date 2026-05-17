import UsersAdminClient from "./UsersAdminClient";
import { prisma } from "../../../lib/prisma";

export default async function UsersPage() {
  const [users, stores] = await Promise.all([
    prisma.user.findMany({
      include: { store: true },
      orderBy: { name: "asc" },
    }),
    prisma.store.findMany({ orderBy: { name: "asc" } }),
  ]);

  const initialUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    store: user.store
      ? {
          id: user.store.id,
          name: user.store.name,
          location: user.store.location,
        }
      : null,
  }));

  const storeOptions = stores.map((store) => ({
    id: store.id,
    name: store.name,
    location: store.location,
  }));

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-4 py-6 sm:px-6 lg:px-8">
      <UsersAdminClient initialUsers={initialUsers} stores={storeOptions} />
    </div>
  );
}
