# Building APK for Notifications

## ✅ Yes, notifications will work in the APK!

When you build a standalone APK (not Expo Go), notifications will work because:
- The app detects it's not Expo Go (`Constants.appOwnership !== 'expo'`)
- All notification permissions, channels, and handlers are properly configured
- The notification setup code runs in standalone builds

## How to Build APK

### Option 1: EAS Build (Recommended - Cloud Build)

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS** (creates `eas.json`):
   ```bash
   eas build:configure
   ```

4. **Build APK**:
   ```bash
   eas build -p android --profile preview
   ```
   - This builds a preview APK (installable without Google Play)
   - The APK will be available for download from Expo's website
   - You'll get a link to download it

### Option 2: Local Build (Requires Android Studio)

1. **Install Android Studio** and set up Android SDK

2. **Build locally**:
   ```bash
   npx expo run:android --variant release
   ```
   - This creates an APK in `android/app/build/outputs/apk/release/`

### Option 3: Development Build APK

1. **Build development APK**:
   ```bash
   npx expo run:android
   ```
   - Creates a debug APK with development tools
   - Good for testing before production build

## After Installing APK

1. **First time you play music**, Android will ask for notification permission
2. **Grant permission** when prompted
3. **Play a track** - you should see "Now Playing" notification in the status bar
4. **Notification shows**: Track title and artist name

## Testing Notifications

- ✅ Play a track → Notification appears
- ✅ Pause → Notification clears
- ✅ Resume → Notification reappears
- ✅ Switch tracks → Notification updates
- ✅ Background playback → Notification stays visible

## Troubleshooting

If notifications don't appear:
1. Check Android Settings → Apps → Your App → Notifications (should be enabled)
2. Check if "Now Playing" notification channel is enabled in Android settings
3. Make sure you granted notification permission when prompted
4. Try uninstalling and reinstalling the APK

## Notes

- **Expo Go**: Notifications won't work (by design - SDK 53+ limitation)
- **Standalone APK**: Notifications work perfectly ✅
- The notification channel is automatically created on first run
- Permissions are requested automatically on first play
