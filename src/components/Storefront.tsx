"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DbProduct } from "@/lib/db";
import type { CartItem } from "@/lib/cart";
import type { Customer } from "@/lib/auth";
import { categoryOrder, money } from "@/lib/products";

type Cart = { items: CartItem[]; subtotal: number; shipping: number; total: number };
const emptyCart: Cart = { items: [], subtotal: 0, shipping: 0, total: 0 };

function BagIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h16l-1 13H5L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>; }
function ArrowIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7"/></svg>; }

export default function Storefront({ products, customer, googleEnabled, authMessage, mode, initialCategory = "All pieces" }: { products: DbProduct[]; customer: Customer | null; googleEnabled: boolean; authMessage: string; mode: "home" | "collection"; initialCategory?: string }) {
  const [category, setCategory] = useState(initialCategory);
  const [origin, setOrigin] = useState("All origins");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(18);
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [drawer, setDrawer] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState(authMessage);
  const categories = useMemo(() => ["All pieces", ...categoryOrder.filter(c => products.some(p => p.category === c))], [products]);
  const shown = products.filter(product =>
    (category === "All pieces" || product.category === category) &&
    (origin === "All origins" || (origin === "Nigeria" ? product.origin_country === "Nigeria" : product.origin_country !== "Nigeria")) &&
    `${product.name} ${product.category} ${product.origin_country}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  const visible = shown.slice(0, visibleCount);
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => { fetch("/api/cart").then(r => r.json()).then(setCart).catch(() => {}); }, []);

  async function updateCart(productId: string, quantity: number) {
    setBusy(productId);
    try {
      const response = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, quantity }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update bag");
      setCart(data); setDrawer(true);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not update bag"); }
    finally { setBusy(null); }
  }

  const productCard = (product: DbProduct) => <article className="product-card" key={product.id}><div className="product-image"><Image unoptimized fill sizes="(max-width: 680px) 50vw, 33vw" src={product.image_url} alt={`AI-generated product concept for ${product.name}`}/>{product.tag && <span className="product-tag">{product.tag}</span>}<button disabled={busy === product.id || cart.items.some(i => i.product_id === product.id && i.quantity >= 20)} className="quick-add" onClick={() => updateCart(product.id, (cart.items.find(i => i.product_id === product.id)?.quantity || 0) + 1)}>{busy === product.id ? "Adding…" : "Add to bag"} <span>＋</span></button></div><div className="product-info"><div><span className="product-category">{product.category} · {product.origin_country}</span><h3>{product.name}</h3></div><strong>{money(product.price_cents)}</strong></div><p className="product-description">{product.description}</p></article>;

  return <>
    <div className="announcement">A little luxury, every day <span>✦</span> Complimentary shipping on orders over ₦150,000</div>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Luxara home">LUXARA<span className="brand-dot">✦</span></Link>
      <nav className="header-nav" aria-label="Main navigation"><Link href="/collection">Shop all</Link><Link href="/collection?category=Perfumes">Fragrance</Link><Link href="/#story">Our story</Link></nav>
      <div className="header-actions">
        {customer ? <form action="/api/auth/logout" method="post"><button className="text-action" type="submit">Hi, {customer.name.split(" ")[0]} · Sign out</button></form> : googleEnabled ? <a className="text-action" href="/api/auth/google">Sign in</a> : null}
        <button className="bag-button" onClick={() => setDrawer(true)} aria-label={`Open bag with ${count} items`}><BagIcon/><span>{count}</span></button>
      </div>
    </header>
    <main>
      {mode === "home" && <><section className="hero">
        <div className="hero-copy"><span className="eyebrow"><i/> SCENT, SPACE & SELF</span><h1>A beautiful way<br/>to <em>be.</em></h1><p>Discover fragrance, atmosphere, and considered pieces for every corner of your life.</p><Link className="button button-dark" href="/collection">Explore the collection <ArrowIcon/></Link><div className="hero-caption"><span>01 / 09</span><span>Made for moments worth keeping</span></div></div>
        <div className="hero-media"><Image unoptimized fill priority sizes="(max-width: 680px) 100vw, 51vw" src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=1600&q=90" alt="Elegant perfume bottles and fragrances"/><div className="hero-stamp">THE ART<br/>OF<br/>EVERYDAY <span>✦</span></div></div>
      </section>
      <section className="promise-bar" aria-label="Shop benefits"><span><b>✦</b> Nigerian & global finds</span><span><b>✦</b> Scented living</span><span><b>✦</b> A little joy, delivered</span></section>
      <section className="featured-section container"><div className="section-heading"><div><span className="eyebrow">THE LUXARA EDIT</span><h2>A few favourites to begin.</h2><p>Explore the scent and style of Luxara.</p></div><Link href="/collection" className="underlined-link">View all {products.length} pieces <ArrowIcon/></Link></div><div className="product-grid">{products.filter(product => product.tag === "Featured").slice(0, 6).map(productCard)}</div><p className="sample-note">AI-generated product concepts for sample inventory. Real stock photos will replace these before launch.</p></section>
      <section className="category-showcase container"><span className="eyebrow">EXPLORE BY MOOD</span><h2>Find your next ritual.</h2><div className="showcase-grid">{["Perfumes", "Diffusers", "Humidifiers", "Aromatics"].map(name => <Link key={name} href={`/collection?category=${name}`}><span>THE LUXARA EDIT</span><strong>{name}</strong><span>Explore <ArrowIcon/></span></Link>)}</div></section>
      </>}
      {mode === "collection" && <section id="shop" className="shop-section container"><div className="section-heading"><div><span className="eyebrow">THE COLLECTION</span><h2>Find your beautiful thing.</h2><p>Fragrance, home, and everyday pieces from Nigeria and beyond.</p></div><span className="item-count">{shown.length.toString().padStart(2, "0")} PIECES</span></div>
        <div className="category-tabs" role="tablist" aria-label="Product categories">{categories.map(c => <button key={c} role="tab" aria-selected={category === c} className={category === c ? "active" : ""} onClick={() => { setCategory(c); setVisibleCount(18); }}>{c}<small>{c === "All pieces" ? products.length : products.filter(p => p.category === c).length}</small></button>)}</div>
        <div className="catalog-tools"><div className="origin-tabs" aria-label="Product origin"><button className={origin === "All origins" ? "active" : ""} onClick={() => { setOrigin("All origins"); setVisibleCount(18); }}>All origins</button><button className={origin === "Nigeria" ? "active" : ""} onClick={() => { setOrigin("Nigeria"); setVisibleCount(18); }}>Made in Nigeria</button><button className={origin === "International" ? "active" : ""} onClick={() => { setOrigin("International"); setVisibleCount(18); }}>International</button></div><input aria-label="Search products" value={search} onChange={event => { setSearch(event.target.value); setVisibleCount(18); }} placeholder="Search the collection…"/></div>
        <div className="product-grid">{visible.map(productCard)}</div>
        {shown.length === 0 && <p className="catalog-empty">No pieces match your search. Try another category or origin.</p>}
        {visible.length < shown.length && <button className="button button-outline load-more" onClick={() => setVisibleCount(count => count + 18)}>Show more pieces <ArrowIcon/></button>}
      </section>}
      {mode === "home" && <><section id="story" className="story-section"><div className="story-image"><Image unoptimized fill sizes="(max-width: 680px) 100vw, 50vw" src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1500&q=85" alt="Natural textures and relaxed home interior"/></div><div className="story-copy"><span className="eyebrow">THE LUXARA FEELING</span><h2>Beauty in <em>every sense.</em></h2><p>We bring together fragrance and thoughtful living pieces with a point of view rooted in Nigeria and open to the world. Every detail is chosen to make the everyday feel a little more special.</p><Link href="/collection" className="underlined-link">Explore the edit <ArrowIcon/></Link><span className="story-mark">LUX <i>✦</i></span></div></section>
      <section id="journal" className="closing-note container"><span className="eyebrow">A NOTE FROM LUXARA</span><h2>A little luxury belongs in every day.</h2><p>Discover the scent, the space, and the details that feel like you.</p><Link className="button button-outline" href="/collection">Shop the collection <ArrowIcon/></Link></section></>}
    </main>
    <footer className="footer"><div className="footer-top"><div><span className="footer-brand">LUXARA ✦</span><p>Scent, space and self — beautifully considered.</p></div><div className="footer-links"><Link href="/collection">Shop all</Link><Link href="/#story">Our story</Link><Link href="/#journal">A note from us</Link></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Luxara</span><span>Beauty in every sense ✦</span></div></footer>
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    {drawer && <div className="drawer-backdrop" onMouseDown={() => setDrawer(false)}><aside className="cart-drawer" aria-label="Shopping bag" onMouseDown={event => event.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">YOUR EDIT</span><h2>Your bag <small>({count})</small></h2></div><button className="close-button" onClick={() => setDrawer(false)} aria-label="Close bag">×</button></div><div className="drawer-body">{cart.items.length ? cart.items.map(item => <div className="cart-item" key={item.product_id}><Image unoptimized width={94} height={112} src={item.image_url} alt=""/><div><span className="product-category">{item.category}</span><h3>{item.name}</h3><strong>{money(item.price_cents)}</strong><div className="quantity"><button onClick={() => updateCart(item.product_id, item.quantity - 1)} aria-label={`Remove one ${item.name}`}>−</button><span>{item.quantity}</span><button disabled={item.quantity >= 20} onClick={() => updateCart(item.product_id, item.quantity + 1)} aria-label={`Add one ${item.name}`}>+</button></div></div></div>) : <div className="empty-bag"><span>✦</span><h3>Something beautiful belongs here.</h3><p>Your bag is waiting for a few Luxara finds.</p><Link className="button button-dark" href="/collection" onClick={() => setDrawer(false)}>Explore the collection <ArrowIcon/></Link></div>}</div>{cart.items.length > 0 && <div className="drawer-foot"><div><span>Subtotal</span><strong>{money(cart.subtotal)}</strong></div><p>Shipping calculated at checkout. Free over ₦150,000.</p><Link className="button button-dark full-width" href="/checkout">Continue to checkout <ArrowIcon/></Link></div>}</aside></div>}
  </>;
}
