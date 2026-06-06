# Native iOS / Android (Capacitor) — ready to build

The app is already an installable PWA. To ship real App Store / Play Store apps, wrap it with
Capacitor. The shell loads badoni.app, so the apps auto-update with your web deploys.

## One-time setup (on your Mac for iOS; any machine for Android)
```
npm i -D @capacitor/cli @capacitor/core
npx cap init Badoni app.badoni.teamportal --web-dir=public
npm i @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

## capacitor.config.ts (create at repo root)
```ts
import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "app.badoni.teamportal",
  appName: "Badoni",
  webDir: "public",
  server: { url: "https://badoni.app", cleartext: false },
};
export default config;
```

## Build / open
```
npx cap sync
npx cap open ios       # builds in Xcode -> submit to App Store
npx cap open android   # builds in Android Studio -> submit to Play
```

## Accounts you'll need (only you can create these)
- Apple Developer Program — $99/yr — developer.apple.com
- Google Play Console — $25 one-time — play.google.com/console
- App icon (1024×1024) + a few screenshots for each store listing.

Push notifications already work via the web (web-push). For native push later, add
@capacitor/push-notifications + APNs/FCM keys.
