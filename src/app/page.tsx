import { getProducts } from "@/lib/db";
import { getCustomer } from "@/lib/auth";
import Storefront from "@/components/Storefront";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const [products, customer] = await Promise.all([getProducts(), getCustomer()]);
  const { auth } = await searchParams;
  const authMessage = auth === "failed" ? "Google sign-in could not be completed. Please try again." : auth === "unavailable" ? "Google sign-in is not configured yet." : "";
  return <Storefront mode="home" products={products} customer={customer} authMessage={authMessage} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />;
}
