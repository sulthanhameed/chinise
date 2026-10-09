# Khang Chinese Restaurant & Dimsum — food ordering platform

Premium Chinese-style food ordering site with an animated stick-figure restaurant intro,
online menu, cart, checkout (UPI / cards / wallets / COD), order tracking, reviews and an admin dashboard.

**Backend: Supabase** (PostgreSQL + Auth + Row Level Security + Edge Functions + Storage).
**Frontend: React + Vite + TypeScript**, deployable to Vercel.

```
chinise/
├── web/                          React app (deploy to Vercel, root directory = web)
│   ├── src/components/IntroAnimation.tsx   stick-figure intro (SVG + CSS keyframes)
│   ├── src/pages/                Home, Menu, TopFoods, Checkout, Track, Profile, Admin …
│   ├── src/data/menu.ts          offline sample menu (used when Supabase env vars are missing)
│   └── public/media/             put hero.mp4 and promo.mp4 here (optional)
└── supabase/
    ├── migrations/               schema, triggers, RLS policies, tracking RPC
    ├── seed.sql                  placeholder menu, categories and testimonials
    └── functions/                create-order · create-payment · verify-payment · update-order-status
```

## 1. Create the Supabase project

1. Create a project at https://supabase.com (region close to your customers).
2. Install the CLI (`npm i -g supabase`) and link the project:
   ```bash
   cd chinise
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push                 # applies migrations/
   psql ...  or SQL Editor: run supabase/seed.sql   (sample menu + testimonials)
   ```
3. Set Edge Function secrets (Project → Edge Functions → Secrets, or `supabase secrets set`):
   ```bash
   supabase secrets set APP_URL=https://your-site.vercel.app
   # Razorpay (UPI)
   supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=...
   # Stripe (cards)
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   # PayPal (wallets)
   supabase secrets set PAYPAL_CLIENT_ID=... PAYPAL_CLIENT_SECRET=... PAYPAL_ENV=sandbox PAYPAL_CURRENCY=USD PAYPAL_INR_RATE=83
   # SMS (Fast2SMS, India)
   supabase secrets set FAST2SMS_API_KEY=...
   # Email (Nodemailer SMTP)
   supabase secrets set SMTP_HOST=smtp.example.com SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... SMTP_FROM="Khang Dimsum <orders@yourdomain.com>"
   ```
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to Edge Functions.
4. Deploy the functions:
   ```bash
   supabase functions deploy create-order
   supabase functions deploy create-payment
   supabase functions deploy verify-payment
   supabase functions deploy update-order-status
   ```
5. Create your admin account: sign up on the site, then in SQL Editor run
   `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`

## 2. Run the frontend locally

```bash
cd web
cp .env.example .env          # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (Project → API)
npm install
npm run dev                   # http://localhost:5173
```
Without the env vars the site runs in **preview mode** with the sample menu; checkout and tracking
show a "connect Supabase" message.

## 3. Deploy

* **Backend:** Supabase (migrations + functions above). No Render or other server is needed.
* **Frontend:** import the repo into Vercel, set *Root Directory* to `web`, and add the env vars
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_RAZORPAY_KEY_ID`.
  `vercel.json` already handles SPA routing.
* Add your Vercel domain to Supabase → Authentication → URL Configuration (Site URL / redirect URLs).

## Data model (Supabase Postgres)

| Table | Purpose |
| --- | --- |
| `profiles` | one row per auth user (name, phone, address, role `customer`/`admin`) |
| `categories` | Dim Sum, Noodles & Soups, Rice & Curry, Snacks, Drinks |
| `products` | menu items: price, description, ingredients, image, rating, availability |
| `orders` | order code (e.g. `KH1A2B3C4D`), customer, totals, status, payment status |
| `order_items` | line items with the price captured at purchase time |
| `payments` | provider (`razorpay` / `stripe` / `paypal` / `cod`), references, status |
| `reviews` | product and site-wide reviews; product rating is recalculated by trigger |
| `tracking_events` | timeline written automatically on every status change |

Security: RLS is enabled on every table. Customers see only their own orders. Admins manage
catalog, orders and users (`is_admin()`). Orders and payments are written only by Edge Functions,
which re-price every cart line from the database, so client-side prices are never trusted.
Public order tracking uses the `get_order_tracking(code)` RPC, which exposes status only.

## Payment flow

1. `create-order` validates input, prices the cart on the server, and stores the order as `pending`.
2. COD: the order is confirmed and SMS/email are sent immediately.
3. Online: `create-payment` opens Razorpay Checkout (UPI), or redirects to Stripe Checkout or PayPal.
4. `verify-payment` confirms the payment with the provider (Razorpay HMAC signature, Stripe session
   status, PayPal capture), marks it paid, and sends the confirmation.
5. `update-order-status` (admin only) moves orders through Preparing → Out for Delivery → Delivered
   and sends notifications.

## Things you still need to supply

* **Menu PDF / Instagram photos:** the source menu could not be read during the build (Instagram returned
  HTTP 403 and no PDF was attached). The menu in `supabase/seed.sql` and `web/src/data/menu.ts` is
  **placeholder data** with sample ₹ prices. Replace it through Admin → Products, or edit `seed.sql`
  and re-run it. The name, price, description and image of each dish can all be changed there.
* **Videos:** place `web/public/media/hero.mp4` and `web/public/media/promo.mp4`. Until then, the
  poster image (`web/public/images/hero-poster.jpg`) is shown with the same blur and gradient overlay.
* **Food photos:** six AI-generated images are in `web/public/images/food/`. Dishes without a photo use
  an emoji placeholder. Add a `.jpg` for any dish and set its `image_url` in the admin.
* **Restaurant details:** address, phone, and hours on the Contact and Services pages are placeholders.
* **Contact form:** not stored yet. Connect it to a table or email API before launch.

## Intro animation

On the first visit in a browser session, a stick-figure restaurant animation plays (about 11.5 s):
a close-up of two colored figures eating and talking, a zoom-out through the dining room, and a
reveal of the entrance with the green **KHANG DIMSUM / CHINESE RESTAURANT** sign. Skip with the
button or Esc. It is turned off for users who prefer reduced motion. Edit
`web/src/components/IntroAnimation.tsx` to change the characters, dishes or timing.

## Brand

Primary `#b91c1c` (deep red) · Secondary `#16a34a` (jade) · Accent `#facc15` (gold) ·
Background `#fff7ed` · Text `#111`. Headings use *Ma Shan Zheng* (brush style); body text uses Inter.
