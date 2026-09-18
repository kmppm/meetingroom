import { getSession } from "@/lib/auth";
import { OrdersClient } from "@/components/orders/OrdersClient";

export default async function MyOrdersPage() {
  const session = await getSession();
  return <OrdersClient session={session} />;
}
