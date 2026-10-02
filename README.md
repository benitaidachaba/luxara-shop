# Luxara

A fragrance and lifestyle storefront built with Next.js, Neon Postgres, Google sign-in, and email order confirmations.

## Run locally

```bash
npm ci
cp .env.example .env.local
# Fill in DATABASE_URL and the service credentials described below.
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The migration creates the tables and seeds 135 **sample** products: 15 each in Perfumes, Diffusers, Humidifiers, Aromatics, Furniture, Lighting, Objects, Textiles, and Accessories. Each category includes Nigerian and international examples. It can be run again safely, but rerunning it resets sample names and prices from the seed file.

The site has separate pages for the [landing page](http://localhost:3000/), [collection](http://localhost:3000/collection), and [checkout](http://localhost:3000/checkout). Each sample product has its own AI-generated product photograph in `public/products/`. These are visual concepts for fictional sample listings, not verified photos of stock. Replace them with real product photos when inventory is available. If changing product names in `src/lib/catalog-data.ts`, update the corresponding image and rerun the migration.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled Postgres connection string. Keep server side only. |
| `APP_URL` | Public app origin, such as `http://localhost:3000` or your deployed HTTPS origin. |
| `GOOGLE_CLIENT_ID` | Web application OAuth client ID from Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Secret for that OAuth client. |
| `MAIL_PROVIDER` | Set to `gmail` for Gmail SMTP, or leave unset/use `mailgun` for Mailgun. |
| `GMAIL_USER` | Full Gmail address used to send confirmations. Required when `MAIL_PROVIDER=gmail`. |
| `GMAIL_APP_PASSWORD` | Google App Password for that address. Required when `MAIL_PROVIDER=gmail`; never use your normal Google password. |
| `MAILGUN_API_KEY` | Mailgun Domain Sending Key for the configured sending domain. |
| `MAILGUN_DOMAIN` | Verified sending domain in Mailgun. |
| `MAILGUN_FROM` | Sender address on that domain, optionally with a display name. |
| `MAILGUN_REGION` | `us` or `eu`; defaults to `us`. |

The local `.env.local` already points to the dedicated Neon project, **Luxara shop**. It is excluded from version control. Set the same values in your deployment environment.

## Google sign-in

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), configure an OAuth consent screen and create an OAuth client of type **Web application**. Add `http://localhost:3000/api/auth/google/callback` to **Authorized redirect URIs**. For deployment, also add `https://YOUR_DOMAIN/api/auth/google/callback`, then set `APP_URL=https://YOUR_DOMAIN` in the deployed environment. Add test users while the consent screen is in testing mode. Copy the client ID and secret into `.env.local`.

The app uses the authorization code flow with PKCE and a state cookie. Google identities are stored in Neon using Google's stable `sub` claim; login sessions are stored as hashed tokens. Guest checkout works without signing in.

## Mailgun

Verify a sending domain in [Mailgun](https://app.mailgun.com/), including its DNS records. Set `MAILGUN_DOMAIN`, `MAILGUN_API_KEY`, and `MAILGUN_FROM` to an address on that domain. For an EU Mailgun account, set `MAILGUN_REGION=eu`.

Mailgun sandbox domains can send only to recipients you authorize in Mailgun. The current local Mailgun domain is an active sandbox domain, so use it for testing and switch to a verified custom sending domain before accepting customer orders.

## Gmail with Nodemailer

For early testing without a sending domain, turn on [Google 2-Step Verification](https://myaccount.google.com/security), create an [App Password](https://myaccount.google.com/apppasswords), and set `MAIL_PROVIDER=gmail`, `GMAIL_USER` to your full Gmail address, and `GMAIL_APP_PASSWORD` to the App Password in `.env.local` and in Vercel Production environment variables. Do not use your normal Gmail password or put the App Password in source control. Gmail will send from the authenticated address. Gmail has daily sending limits and may block automated traffic, so use a dedicated transactional email provider for sustained customer traffic.

After an order is saved, the server sends a plain text confirmation email through the selected provider and records `sent`, `failed`, or `not_configured` in `orders.email_status`. An email outage does not erase a placed order.

## Deploy on Vercel

In the Vercel project, open **Settings → Environment Variables** and add `DATABASE_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` for **Production**. For email, add either `MAIL_PROVIDER=gmail`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD`, or the `MAILGUN_*` values listed above. Set `APP_URL` to the site's permanent HTTPS origin, without a trailing slash (for example, `https://shop.example.com`). These values are separate from local `.env.local`; do not commit that file or add a `NEXT_PUBLIC_` prefix to secrets.

In the Google OAuth web client, add the exact production callback URL, for example `https://shop.example.com/api/auth/google/callback`, under **Authorized redirect URIs**. Keep the localhost callback too for local testing. Google matches the full URI exactly. If using Vercel Preview deployments, use a stable preview domain and register its exact callback separately; random deployment URLs will not match a single registered redirect URI.

The Neon schema has already been created. If deploying to a different Neon database, run `npm run db:migrate` against that database before the first visit. If importing a repository whose root contains this `stage2` folder, set the Vercel Root Directory to `stage2`.

## Checkout behavior

The bag, products, customer accounts, sessions, orders, and order line items are stored in Neon. The server reads prices from the product table when placing an order and saves a price snapshot on each line item. Prices are displayed in Nigerian naira. The sample delivery policy is ₦5,000, or complimentary from ₦150,000; replace it with your real policy before launch.

Product names, prices, origins, and AI-generated product images are sample inventory. Replace them with verified stock before taking real customer orders. The storefront and checkout state this clearly.

Checkout currently places an **order request**. It does **not** charge a card; add a payment provider before accepting online payments. The page tells customers this before they place an order.
