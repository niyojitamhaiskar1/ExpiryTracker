# Expiry Tracker (Mobile)

A real, working React Native / Expo app for tracking product expiry dates — no backend, no
database setup required. Everything is stored on-device with AsyncStorage.

## Preview it in your browser — no phone, no Android Studio, no Gradle

```bash
npm install
npm run web
```

This opens the app at `http://localhost:8081` (or wherever the terminal says) in your default
browser. It's the full app — Add Product, dashboard stats, search/filter, the scanner — running
on your PC. I tested this exact flow (add a product, confirm it lands on the dashboard with the
right date and stats) before sending this over, and it works.

One small difference on web: the native calendar popup used on Android/iOS isn't available in a
browser, so the "Expiry date" field is a plain date box there instead — same result, just a
different control.

## Running it on your phone instead — still no Android Studio, no Gradle

```bash
npm install
npx expo start
```

Then, on your phone:

1. Install the **Expo Go** app (Play Store / App Store — it's free).
2. Scan the QR code that `npx expo start` prints in your terminal, using the Expo Go app
   (Android) or the Camera app (iPhone).

No `expo prebuild`, no `expo run:android`, no Android SDK, no Gradle download, no `adb`.

> If the QR code / link doesn't connect: your phone and PC usually need to be on the **same
> Wi-Fi network**. If they are and it still fails (common on office/school/hotel Wi-Fi that
> isolates devices from each other), run `npx expo start --tunnel` instead — it routes the
> connection through Expo's servers so network isolation stops mattering.

> If you previously ran `npx expo prebuild`, delete the generated `android/` (and `ios/`)
> folders before running `npm install` again — they're leftover native projects from the old
> ML-Kit-based scanner and aren't used anymore.

## What was actually broken, and what changed

The zip you had wouldn't run at all, for a few stacked reasons:

1. **`assets/icon.png` didn't exist**, even though `app.json` pointed at it. That's what caused
   `expo prebuild` to fail with `ENOENT ... assets/icon.png`. Fixed: added `assets/icon.png`,
   `assets/adaptive-icon.png`, and `assets/favicon.png`.
2. **The scanner used `@react-native-ml-kit/text-recognition`**, a native module that only works
   in a custom "dev build" — never in plain Expo Go. That's what forced you into
   `expo prebuild` → `expo run:android` → Android SDK → Gradle in the first place, and that
   Gradle download timed out, so the app never actually launched on your phone. Since the app
   never launched, *every* feature looked "not working" — Add Product, the stats, Categories,
   all of it — even though that code itself was fine.
3. Fixed: the scanner now calls a free cloud OCR service (**OCR.space**) over plain HTTPS
   instead of a native module. See `src/utils/ocr.ts` — it ships with OCR.space's public demo
   key (`helloworld`, no signup needed) so "Process Image" works immediately. That demo key is
   rate-limited (~500 scans/day, shared with everyone using it), so for regular use grab your
   own free key at https://ocr.space/ocrapi/freekey (10-second signup) and paste it into the
   `OCR_SPACE_API_KEY` constant at the top of `ocr.ts`.
4. Removed two unused/no-longer-needed dependencies that only existed to support the old native
   scanner: `react-native-vector-icons` and `@react-navigation/bottom-tabs`.
5. Added browser/web support (`react-native-web`, `react-dom`, `@expo/metro-runtime`) plus a
   web-friendly date input, so you can preview the whole app with `npm run web` — no phone or
   emulator needed at all.

I verified the fixed project actually installs and bundles cleanly (`npm install`, `tsc --noEmit`,
and a full Metro `expo export` all pass with zero errors) before handing it back.

## What works

- **Expiry Tracker** (renamed — was "Inventory", then "Tracker") — the dashboard is a clean
  overview: stats, notifications, and category shortcuts. Browsing/searching lives on its own
  page.
- **Floating "+" button** — a round add-product button fixed to the bottom-center of the screen,
  on both the dashboard and the browse/category list pages. Same behavior on a phone (Expo Go)
  and in a browser tab.
- **Add Product** — form with name, a **required** category (you can't save without picking
  one), and date picker; saves to on-device storage and shows up instantly on the dashboard.
- **Dashboard stats** — tap **Expired** or **Expiring Soon** to open a filtered list of exactly
  those products. Tap **Total Items** or **Categories** to browse everything.
- **Browse by category** — tap any category on the dashboard (All, Food, Medicine, Cosmetics,
  Electronics, Other) to open a dedicated page for it: category chips at the top (switch
  categories without going back), a search bar below that, then the matching products.
- **Notifications** — the bell icon on the dashboard shows a badge with how many products need
  attention, and opens a page grouping them into Already Expired / Expiring Today / Next 7 Days
  / Next 15 Days / Next 30 Days. This is computed live from your data every time you open it —
  see the note below on why it's not an OS push notification.
- **Scanner** — take or pick a photo, tap "Process Image" to run OCR via OCR.space. Tap a
  detected date (or "Continue without a detected date" if none were found, so you're never
  stuck) to move to Add Product, where you pick the category and save.
- **Delete** — trash icon with a confirm dialog on each product. There's no separate "delete
  all" — every product list already shows a delete action per item, so a bulk option would just
  duplicate that.

### A note on the app's "name"

I updated everything the user actually sees: the dashboard title, the name shown under the app
icon (`app.json`'s `name` field), permission-prompt text, and the README. I left the *technical*
identifiers alone — the Android package id (`com.expiryguard.mobile`), the Expo "slug", and the
npm package name in `package.json`. Those aren't shown to you; changing them can effectively
make it "a different app" for installs/signing, so I only touch them if you specifically want
that.

### A note on "notifications"

You asked for daily notifications (30/15/7/day-of reminders). I built an **in-app notification
center** (the bell icon) rather than real OS push/local notifications, on purpose: actual
scheduled notifications behave very differently — and are genuinely unreliable — across Expo Go
vs. a real build vs. a browser tab, and you specifically need this to keep working in both Expo
Go and web. The in-app version is always accurate (it's computed from your real data every time
you open it) and behaves identically everywhere.

If you do want real push notifications later, that means using `expo-notifications` in a custom
dev build (not Expo Go) for the phone, which is a separate, bigger step — happy to build that
next if you want it, just know it's mobile-only (browsers can't do background daily
notifications without a service worker + you keeping a tab open).

## Project structure

```
App.tsx                        # navigation + providers
assets/                        # icon.png, adaptive-icon.png, favicon.png
src/
  context/ProductContext.tsx   # AsyncStorage-backed product store (CRUD)
  screens/
    DashboardScreen.tsx        # overview: stats, notification bell, category shortcuts
    ProductListScreen.tsx      # filtered/searchable list (by category and/or status)
    NotificationsScreen.tsx    # grouped upcoming-expiry alerts
    AddProductScreen.tsx       # add product form (category required)
    ScannerScreen.tsx          # camera/gallery + OCR
  components/
    StatCard.tsx                # tappable dashboard stat tile
    ProductCard.tsx
    FloatingAddButton.tsx        # round bottom "+" button (native + web)
  utils/
    dateUtils.ts                 # status calc, date parsing from OCR text, alert bucketing
    ocr.ts                       # cloud OCR (OCR.space) — no native build required
  types/index.ts
```

## If you eventually want a standalone APK

You don't need this for day-to-day use or testing — Expo Go covers that. But if you later want
an installable `.apk`/`.aab` without ever touching Android Studio, use Expo's free cloud build
service instead of building locally:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

This builds on Expo's servers, not your machine, so it sidesteps the Android SDK/Gradle setup
entirely. It needs a (free) Expo account.

## Next steps if you want to go further

- **Real backend**: swap `ProductContext` for API calls to a backend (Express + MongoDB, etc.)
  if you want data to sync across devices instead of living only on one phone.
- **Push notifications**: `expo-notifications` for on-device reminders (7/3/1 day before
  expiry) — works fine in Expo Go too.
- **Your own OCR key**: swap the demo key in `ocr.ts` for your free personal one so you're not
  sharing a rate limit with every other OCR.space demo-key user.
