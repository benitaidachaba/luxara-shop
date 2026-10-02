import { getCustomer } from "@/lib/auth";
import Checkout from "@/components/Checkout";

export const dynamic = "force-dynamic";
export default async function CheckoutPage() {
  const customer = await getCustomer();
  return <Checkout customer={customer} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />;
}
