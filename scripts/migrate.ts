import { neon } from "@neondatabase/serverless";
import { seedProducts } from "../src/lib/products";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY, name text NOT NULL, category text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0), color text NOT NULL,
  image_url text NOT NULL, tag text NOT NULL DEFAULT '', description text NOT NULL,
  origin_country text NOT NULL DEFAULT 'Nigeria', sample boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0
)`;
await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS origin_country text NOT NULL DEFAULT 'Nigeria'`;
await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sample boolean NOT NULL DEFAULT true`;
await sql`CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), google_sub text UNIQUE NOT NULL,
  email text NOT NULL, name text NOT NULL, picture text,
  created_at timestamptz NOT NULL DEFAULT now()
)`;
await sql`CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY, customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
)`;
await sql`CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
)`;
await sql`CREATE TABLE IF NOT EXISTS cart_items (
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES products(id), quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  PRIMARY KEY (cart_id, product_id)
)`;
await sql`CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  cart_id uuid UNIQUE NOT NULL REFERENCES carts(id),
  email text NOT NULL, full_name text NOT NULL, address_line1 text NOT NULL,
  address_line2 text NOT NULL DEFAULT '', city text NOT NULL, region text NOT NULL,
  postal_code text NOT NULL, country text NOT NULL,
  subtotal_cents integer NOT NULL, shipping_cents integer NOT NULL,
  total_cents integer NOT NULL, status text NOT NULL DEFAULT 'placed',
  email_status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now()
)`;
await sql`CREATE TABLE IF NOT EXISTS order_items (
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES products(id), name text NOT NULL,
  price_cents integer NOT NULL, quantity integer NOT NULL,
  PRIMARY KEY (order_id, product_id)
)`;
await sql`ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'requested'`;
const rows = seedProducts.map((product, sort_order) => ({
  id: product.id, name: product.name, category: product.category,
  price_cents: product.price, color: product.color, image_url: product.image,
  tag: product.tag, description: product.description, origin_country: product.originCountry,
  sort_order,
}));
await sql`INSERT INTO products (id, name, category, price_cents, color, image_url, tag, description, origin_country, sort_order)
  SELECT id, name, category, price_cents, color, image_url, tag, description, origin_country, sort_order
  FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS p(
    id text, name text, category text, price_cents integer, color text, image_url text,
    tag text, description text, origin_country text, sort_order integer
  )
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category,
    price_cents = EXCLUDED.price_cents, color = EXCLUDED.color, image_url = EXCLUDED.image_url,
    tag = EXCLUDED.tag, description = EXCLUDED.description, origin_country = EXCLUDED.origin_country,
    sort_order = EXCLUDED.sort_order, active = true`;
console.log("Database ready; seeded", seedProducts.length, "products");
