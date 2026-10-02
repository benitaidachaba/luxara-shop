"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Customer } from "@/lib/auth";
import type { CartItem } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD, money } from "@/lib/products";

type Cart = { items: CartItem[]; subtotal: number; shipping: number; total: number };

export default function Checkout({ customer, googleEnabled }: { customer: Customer | null; googleEnabled: boolean }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  useEffect(() => { fetch("/api/cart").then(r => r.json()).then(setCart).catch(() => setError("Could not load your bag.")); }, []);

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not place your order.");
      setOrderNumber(result.orderNumber); setEmailStatus(result.emailStatus);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not place your order."); }
    finally { setBusy(false); }
  }

  return <div className="checkout-page"><header className="checkout-header"><Link href="/" className="brand">LUXARA<span className="brand-dot">✦</span></Link><span>YOUR ORDER</span></header>
    {orderNumber ? <main className="success-page"><div className="success-icon">✓</div><span className="eyebrow">REQUEST RECEIVED</span><h1>Something lovely<br/><em>is in motion.</em></h1><p>Thank you for choosing Luxara. Your order request <strong>{orderNumber}</strong> has been saved. {emailStatus === "sent" ? "A confirmation email is on its way." : "Please save your order number for your records."}</p><Link className="button button-dark" href="/collection">Back to the shop <span>→</span></Link></main> : <main className="checkout-layout"><section className="checkout-form"><Link className="back-link" href="/collection">← &nbsp;Back to shopping</Link><span className="eyebrow">ALMOST THERE</span><h1>Checkout<span>.</span></h1><p className="checkout-intro">A few details, and your Luxara finds are one step closer.</p>
      {customer ? <div className="signed-in">Signed in as <strong>{customer.email}</strong></div> : googleEnabled ? <a className="google-button" href="/api/auth/google"><span className="google-g">G</span> Continue with Google</a> : null}
      <form onSubmit={placeOrder}><div className="form-section-heading"><span>01</span><h2>Contact information</h2></div><div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" defaultValue={customer?.email || ""} required placeholder="you@example.com"/></div>
      <div className="form-section-heading second"><span>02</span><h2>Delivery details</h2></div><div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" autoComplete="name" defaultValue={customer?.name || ""} required placeholder="Your full name"/></div><div className="field"><label htmlFor="addressLine1">Street address</label><input id="addressLine1" name="addressLine1" autoComplete="address-line1" required placeholder="House number and street name"/></div><div className="field"><label htmlFor="addressLine2">Apartment, suite, etc. <span>(optional)</span></label><input id="addressLine2" name="addressLine2" autoComplete="address-line2" placeholder="Apartment or suite"/></div><div className="field-row"><div className="field"><label htmlFor="city">City</label><input id="city" name="city" autoComplete="address-level2" required/></div><div className="field"><label htmlFor="region">State / Region</label><input id="region" name="region" autoComplete="address-level1" required/></div></div><div className="field-row"><div className="field"><label htmlFor="postalCode">Postal code <span>(optional)</span></label><input id="postalCode" name="postalCode" autoComplete="postal-code"/></div><div className="field"><label htmlFor="country">Country</label><input id="country" name="country" autoComplete="country-name" required defaultValue="Nigeria"/></div></div>
      <div className="checkout-note"><span>✦</span><p>This is sample inventory. Orders are requests; no payment is collected online. We&apos;ll confirm availability and delivery before payment.</p></div>{error && <p className="form-error" role="alert">{error}</p>}<button disabled={busy || !cart?.items.length} className="button button-dark full-width place-order" type="submit">{busy ? "Placing your request…" : "Place order request"}<span>→</span></button><p className="secure-note">Your details are used only to review your order request.</p></form></section>
      <aside className="order-summary"><div className="summary-inner"><span className="eyebrow">YOUR LUXARA EDIT</span><h2>Your order <small>({cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0})</small></h2>{cart === null ? <p>Loading your bag…</p> : cart.items.length === 0 ? <div className="summary-empty">Your bag is empty. <Link href="/collection">Find something lovely</Link>.</div> : <><div className="summary-items">{cart.items.map(item => <div className="summary-item" key={item.product_id}><div className="summary-image"><Image unoptimized width={66} height={66} src={item.image_url} alt=""/><span>{item.quantity}</span></div><div><h3>{item.name}</h3><small>{item.category}</small></div><strong>{money(item.price_cents * item.quantity)}</strong></div>)}</div><div className="summary-totals"><div><span>Subtotal</span><strong>{money(cart.subtotal)}</strong></div><div><span>Sample delivery</span><strong>{cart.shipping ? money(cart.shipping) : "Complimentary"}</strong></div><div className="summary-total"><span>Estimated total</span><strong>{money(cart.total)}</strong></div></div><p className="shipping-message">✦ &nbsp;{cart.shipping ? `${money(FREE_SHIPPING_THRESHOLD - cart.subtotal)} away from complimentary sample delivery` : "Your order qualifies for complimentary sample delivery"}</p></>}</div></aside></main>}
  </div>;
}
