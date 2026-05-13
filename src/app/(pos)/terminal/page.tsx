import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PosPage from "../../../components/pos/page";
import { getAuthPayloadFromCookies } from "../../../lib/token-utils";

export default async function TerminalPage() {
  const auth = await getAuthPayloadFromCookies(await cookies());
  if (!auth) {
    redirect("/login");
  }

  return (
    <PosPage
      initialStoreLocation={auth.storeLocation ?? null}
      initialStoreName={auth.storeName ?? null}
    />
  );
}
