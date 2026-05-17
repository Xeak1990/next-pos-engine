import type { ReactNode } from "react";
import AppShell from "../../components/shared/AppShell";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
