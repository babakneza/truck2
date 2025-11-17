# Android APK Build Guide

## Setup for GitHub Actions (Recommended)

### Prerequisites
- GitHub repository (push this code to GitHub)
- GitHub Actions enabled (default for public repos)

### Quick Start

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Capacitor and GitHub Actions workflow"
   git push origin master
   ```

2. **Trigger Build**
   - Go to your GitHub repo → Actions tab
   - Workflow "Build Android APK" will run automatically on push
   - APK will be available as artifact after build completes (~5-10 min)

3. **Download APK**
   - Go to Actions → Latest workflow run
   - Scroll to "Artifacts" section
   - Download `truck2-release.apk`

### Manual Build (Local)

If you want to build locally:

```bash
# Build React app
npm run build

# Initialize Capacitor Android (first time only)
npx cap add android

# Sync web assets
npx cap sync android

# Build APK (requires Android Studio + SDK)
cd android
./gradlew assembleRelease
cd ..

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

### Configuration

Edit `capacitor.config.json` to customize:
- **appId**: Application package name (e.g., `com.truck2.app`)
- **appName**: Display name
- **webDir**: Points to React build output (`dist`)

### Build Variants

The GitHub Actions workflow builds a **release APK** (optimized, unsigned).

To sign the APK for Play Store distribution:
1. Generate a signing key
2. Add to GitHub Secrets
3. Update workflow to sign APK

### Troubleshooting

**APK artifact missing?**
- Check workflow logs in Actions tab
- Verify `npm run build` succeeds locally first
- Ensure Java 17+ and Android SDK are installed

**App not running on device?**
- Check API level compatibility (min API 24 recommended)
- Verify app permissions in `android/app/src/AndroidManifest.xml`
- Check device logs: `adb logcat`

### Next Steps

1. Add code signing for Play Store deployment
2. Configure signing in GitHub Secrets
3. Create signed release build
