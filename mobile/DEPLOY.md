# Deploy to TestFlight (iOS)

Your project is already set up with EAS. Use these steps to ship to TestFlight.

## Prerequisites

- Apple Developer account (paid) — you have this
- EAS CLI installed and logged in

## One-time setup

### 1. Install EAS CLI and log in

```bash
cd mobile
npm install -g eas-cli
eas login
```

(Use your Expo account; create one at [expo.dev](https://expo.dev) if needed.)

### 2. App in App Store Connect (optional but recommended)

- Go to [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** → **New App**
- Platform: **iOS**
- Name: e.g. **MatBoks** (or the name you want on the store)
- Primary language, bundle ID: **com.prisappen.app** (must match `app.json`)
- SKU: e.g. `matboks-ios`

You can also let EAS create the app for you on first submit.

## Build and submit to TestFlight

From the **mobile** folder:

```bash
cd mobile
eas build --platform ios --profile production --auto-submit
```

- EAS will prompt for your **Apple ID** (Apple Developer account email) and an **app-specific password** (create one at [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords).
- First run may ask to create the app in App Store Connect if it doesn’t exist.
- Build runs in the cloud (about 10–20 min). When it finishes, the same run submits to TestFlight.

## After the build

1. In [App Store Connect](https://appstoreconnect.apple.com) → your app → **TestFlight**.
2. Wait for the build to finish “Processing” (often 5–15 min).
3. Add **Internal** or **External** testers and install via the TestFlight app.

## If the build fails

- Open the **build URL** EAS prints (e.g. `https://expo.dev/accounts/.../builds/...`) and check the **full log**.
- The **Install dependencies** step runs `npm ci`; the log will show which package or command failed.
- Typical fixes: pin **Node** in `eas.json` (we use `"node": "20.18.0"`), fix peer dependency issues, or remove/update a failing dependency.

## Useful commands

| Command | Purpose |
|--------|--------|
| `eas build --platform ios --profile production` | Build only (no submit) |
| `eas submit --platform ios --latest` | Submit the latest build to TestFlight |
| `eas build:list` | List recent builds |

## Bundle ID and version

- **Bundle ID:** `com.prisappen.app` (in `app.json` → `expo.ios.bundleIdentifier`)
- **Version:** `1.0.0` in `app.json`; build number is incremented automatically by EAS for production builds.
