{
  description = "OnlyGroceries DevShell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    android-nixpkgs = {
      url = "github:tadfisher/android-nixpkgs/stable";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    nixpkgs,
    flake-utils,
    android-nixpkgs,
    rust-overlay,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [(import rust-overlay)];
        };

        androidSdk = android-nixpkgs.sdk.${system} (sdkPkgs:
          with sdkPkgs; [
            build-tools-35-0-0
            build-tools-36-0-0
            platform-tools
            cmdline-tools-latest
            emulator
            platforms-android-35
            platforms-android-36
            sources-android-35
            system-images-android-36-google-apis-x86-64
            ndk-29-0-14206865
          ]);
      in {
        devShells.default = pkgs.mkShell rec {
          packages = with pkgs; [
            androidSdk
            zulu # for app signing

            pnpm_10
            nodejs_22

            pango
            gdk-pixbuf
            at-spi2-atk
            libsoup_3
            webkitgtk_4_1

            pkg-config
            gobject-introspection
            cargo
            (rust-bin.stable.latest.minimal.override
              {
                targets = [
                  "aarch64-linux-android"
                  "armv7-linux-androideabi"
                  "x86_64-linux-android"
                  "i686-linux-android"
                ];
              })
          ];

          JAVA_HOME = "${pkgs.jdk17}";
          ANDROID_SKD_ROOT = "${androidSdk}/share/android-sdk";
          ANDROID_HOME = "${androidSdk}/share/android-sdk";
          NDK_HOME = "${ANDROID_HOME}/ndk/29.0.14206865";
          ANDROID_AVD_HOME = "/home/threetimeslazy/.config/.android/avd";
          GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${androidSdk}/share/android-sdk/build-tools/35.0.0/aapt2";
        };
      }
    );
}
