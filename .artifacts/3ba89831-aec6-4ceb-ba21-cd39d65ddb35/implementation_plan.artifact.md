# Migration to Expo Development Build

Transition the project from Expo Go to a Custom Development Build to support native modules (AdMob, RevenueCat, Worklets).

## User Review Required

> [!IMPORTANT]
> This migration will replace the standard Expo Go app on your phone with a custom "Polonais Facile" development app. You will need to build this app locally using `npx expo run:android`.

> [!WARNING]
> I have used the standard AdMob Test App ID (`ca-app-pub-3940256099942544~3347511713`) in `app.json`. You must replace this with your production ID before releasing.

## Proposed Changes

### Configuration

#### [MODIFY] [app.json](file:///C:/dev/PolonaisFacile/app.json)
*   Add `react-native-google-mobile-ads` to `plugins` with test App ID.
*   Add `expo-notifications` to `plugins`.
*   Enable `newArchEnabled: true` in `expo-build-properties` to support Reanimated 4.x.

#### [MODIFY] [package.json](file:///C:/dev/PolonaisFacile/package.json)
*   Ensure `expo-dev-client` is present (already installed via shell).

#### [NEW] [eas.json](file:///C:/dev/PolonaisFacile/eas.json)
*   Create configuration for development and production build profiles.

## Verification Plan

### Manual Verification
1.  Run `npx expo run:android` to compile and install the app.
2.  Verify the app opens without crashing.
3.  Check Logcat to confirm RevenueCat and AdMob initialize correctly.
