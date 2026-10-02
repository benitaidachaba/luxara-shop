import { getProducts } from "@/lib/db";
import { getCustomer } from "@/lib/auth";
import { categoryOrder } from "@/lib/products";
import Storefront from "@/components/Storefront";

export const dynamic = "force-dynamic";

export default async function Collection({ searchParams }: { searchParams: Promise<{ category?: string; auth?: string }> }) {
  const [products, customer, params] = await Promise.all([getProducts(), getCustomer(), searchParams]);
  const initialCategory = categoryOrder.find(category => category === params.category) ?? "All pieces";
  const authMessage = params.auth === "failed" ? "Google sign-in could not be completed. Please try again." : params.auth === "unavailable" ? "Google sign-in is not configured yet." : "";
  return <Storefront key={initialCategory} mode="collection" initialCategory={initialCategory} products={products} customer={customer} authMessage={authMessage} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />;
}
