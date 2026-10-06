# Android Development Notes

Android Development is a nightmare, so here's a little note for myself on how
to develop for it (without Android Studio)

## Prerequisites

Enter the Nix development environment first:

```bash
nix develop .#android
```

## Create Emulator Virtual Device

```bash
# Keep --package argument in sync with flake.nix.
# For available packages (= system images), run
# - nix flake show github:tadfisher/android-nixpkgs | grep system-images-android
avdmanager create avd --name pixel_9 --package "system-images;android-36;google_apis;x86_64" --device pixel_9

# Check that the AVD is created. It everything is fine,
# a non-empty list will be printed
emulator -list-avds

# Start the AVD in a separate terminal
emulator -avd pixel_9
```

## Tauri

```bash
# Start tauri dev build with hot reload. If the emulator is running, the command will detect it and install the app. Otherwise, it will hang forever until you stop it.
pnpm tauri android dev

# Alternatively, build the release APK
pnpm tauri android build

# If you're not in nix shell, but have nix installed, run
nix develop .#android -c pnpm tauri android build

# By default, the APK file's path is ./src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk

# If you don't want to pollute your computer with android things, build purely with Nix
# Debug
nix build .#android

# Release
nix build .#android-release

# In this case, the built APK will be at ./result/onlygroceries-arm64-release-unsigned.apk
```

## Install APK from Terminal

### App Signing

To make android to install the built APK, it has to be signed.

Generate keystore:

```bash
nix develop .#signing --command keytool -genkey -v -keystore ~/nonscalable-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias nonscalable
```

### Sing the APK: 

```bash
nix develop .#signing --command apksigner sign \
    --ks "$HOME/nonscalable-keystore.jks" \
    --ks-key-alias nonscalable \
    --out onlygroceries-release.apk \
    onlygroceries-release-aligned.apk
```

### Transfer to Device

Enable "Wireless Debugging" on the phone. Makes no sense to describe how to do it, it's probably changes a hundred times already, so google it.

Then, run

```bash
adb devices
# Should have something like
# $ adb devices
# List of devices attached
# adb-4A110DLAQ0028B-c6Yy3Q._adb-tls-connect._tcp	device

# Checkout the phone for its IP:PORT and run
adb -s <ip:port> install <path/to/apk>

# Sometimes, it's needed to remove the APK from Emulator. For that, run
adb uninstall coop.nonscalable.onlygroceries
```

## Generate App Icons

```bash
pnpm tauri icon ./web/public/icon-512.png
```

