# Android Development Notes

Android Development is a nightmare, so here's a little note for myself on how
to develop for it (without Android Studio)

## Prerequisites

Enter the Nix development environment first:

```bash
nix develop
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
nix develop -c pnpm tauri android build

# By default, the APK file's path is ./src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

## Install APK from Terminal

### App Signing

To make android to install the built APK, it has to be signed.

Generate keystore:

```bash
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

### Configure Signing: 

Create `src-tauri/gen/android/keystore.properties` (gitignored) with keystore details.

```properties
password=<password>
keyAlias=upload
storeFile=/abs/path/to/upload-keystore.jks
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

### Build APK in Docker

First, I wanted to build the APK in Nix only, but it turned out harder than I thought because of Gradle:

- https://nixos.org/manual/nixpkgs/unstable/#gradle - At the time, Gradle didn't have proper dependencies lock (AFAIK), so Nix had to implement a MITM proxy to capture its traffic and generate a lockfile for Gradle (lol)
- https://github.com/NixOS/nixpkgs/issues/381969 - Then Gradle got proper lockfile mechanism, but
- https://github.com/gradle/gradle/issues/32739 - Still does not work with Nix

So, here's a nix-shell-in-docker Dockerfile

Run it as

```sh
docker build \
    --secret id=jks,src=$HOME/upload-keystore.jks \
    --secret id=properties,src=$PWD/src-tauri/gen/android/keystore.properties --tag onlygroceries-apk .

docker cp $(docker create onlygroceries-apk:latest --name onlygroceries-apk):/dist/app.apk ./app.apk
```
