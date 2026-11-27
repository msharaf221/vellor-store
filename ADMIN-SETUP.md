# Admin app: setup

The store works in **demo mode** out of the box. Everything (products, orders, settings) is saved in the browser of the device you use, so you can try the whole admin at `/admin/` without any account.

To use a **real shared database** (orders from customers land in the admin on your phone, from any device), switch on Supabase (free). About 10 minutes.

## 1. Create the Supabase project
1. Go to supabase.com, sign in, **New project** (free plan, any region near Egypt/Europe).
2. Open **SQL Editor > New query**, paste all of `supabase/schema.sql`, press **Run**.

## 2. Create your admin login
1. **Authentication > Users > Add user > Create new user**. Use your email and a strong password. Tick "Auto confirm".
2. **Authentication > Sign In / Providers**: turn **off** "Allow new users to sign up" so nobody else can create an account.

## 3. Connect the site
1. **Project Settings > API**: copy the **Project URL** and the **anon public key** (the anon key is meant to be public; the security rules in the schema protect the data).
2. Put both in `config.js`:
   `supabase: {url: "https://xxxx.supabase.co", anonKey: "eyJ..."}`
3. Push. From that moment the store reads products from Supabase, saves orders there, and `/admin/` asks for your email and password.

Never use the **service_role** key in this project.

## 4. First use
Open `https://YOUR-SITE/admin/`, sign in, add your categories (More tab), then your products with photos (Products tab, + button). Photos are uploaded to the `products` storage bucket.

## Install on your phone
Open `/admin/` in Chrome, menu (three dots), **Install app**. On iPhone: Safari, Share, **Add to Home Screen**.

## New order alerts
- While the app is open or in the background, it checks for new orders every 20 seconds and rings, vibrates and shows a notification (tap More > enable notifications).
- When the app is fully closed, phones do not run it. For alerts in that case you need a push service (free options: a Supabase Edge Function that sends a Telegram message on each new order). This is an optional next step.

## Notes
- Stock goes down automatically when an order arrives and comes back if you cancel the order.
- Prices, stock and photos you edit in the admin appear in the store immediately.
- Take a backup from More > "Backup" now and then.
