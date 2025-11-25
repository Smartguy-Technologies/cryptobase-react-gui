# Cryptobase ATM Wallet Branding Bundle (v2)

This bundle is designed for the `client-brand` branch that you created from your
clean `upstream` branch of `edge-react-gui`.

It makes `yarn brand:cryptobase` a full rebrand step:
  - Theme + config + APIs switched to Cryptobase.
  - env.json regenerated with APP_CONFIG="cryptobase".
  - appConfig.ts turned into a dynamic loader (edge / test / cryptobase).
  - Android & iOS native bundle IDs and app names updated.

## Files in this bundle

- branding/cryptobase/brand-config.json
    Metadata for the brand (appName, bundleId, appConfigName).

- branding/cryptobase/config/cryptobaseConfig.ts
    Your Cryptobase AppConfig for iOS.

- branding/cryptobase/config/cryptobaseConfigAndroid.ts
    Your Cryptobase AppConfig for Android (if you choose to branch per-platform).

- branding/cryptobase/config/cryptobaseAPIs.ts
    Your API keys and endpoints for services like Coingecko, changenow, etc.

- branding/cryptobase/theme/variables/cbDark.ts
- branding/cryptobase/theme/variables/cbLight.ts
    Your dark/light theme implementations, including Cryptobase logos & assets.

- branding/cryptobase/env/env.cryptobase.json
    A base env.json for Cryptobase. The branding script will copy this to env.json
    and force APP_CONFIG="cryptobase".

- src/theme/appConfig.cryptobase.template.ts
    A dynamic appConfig loader that picks which AppConfig to use based on ENV.APP_CONFIG,
    including the new `cryptobase` config.

- src/theme (in this bundle)
    Only contains the template; in your real repo you already have the rest of the theme.

- scripts/brand/applyBranding.js
    The main branding script, which you invoke by:
      yarn brand:cryptobase

## How to integrate into your fork

1. On your `client-brand` branch, copy the contents of this bundle into your repo root,
   preserving folder structure. You should end up with:

     branding/cryptobase/...
     src/theme/appConfig.cryptobase.template.ts
     scripts/brand/applyBranding.js

2. Ensure you have the following Yarn script in package.json:

     "scripts": {
       "brand:cryptobase": "node scripts/brand/applyBranding.js"
     }

3. Run the branding script:

     yarn brand:cryptobase

   This will:
     - Copy cryptobaseConfig.ts, cryptobaseAPIs.ts, cbDark/cbLight into src/theme.
     - Replace src/theme/appConfig.ts with src/theme/appConfig.cryptobase.template.ts.
     - Write env.json from branding/cryptobase/env/env.cryptobase.json, forcing
       APP_CONFIG="cryptobase".
     - Optionally patch src/envConfig.ts APP_CONFIG default to 'cryptobase'.
     - Update Android & iOS native bundle IDs and app names.

4. Build as usual:

     yarn android
     # and/or
     yarn ios

5. Keeping in sync with upstream

   When Edge releases updates:

     git checkout upstream
     git fetch edge
     git reset --hard edge/develop
     git push -f origin upstream

     git checkout client-brand
     git merge upstream
     yarn brand:cryptobase
     yarn android   # or yarn ios

This keeps your business logic and UI on top of the upstream Edge app with a clean,
automated branding layer.
