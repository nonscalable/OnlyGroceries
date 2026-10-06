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

        signingSdk = android-nixpkgs.sdk.${system} (sdkPkgs:
          with sdkPkgs; [
            build-tools-36-0-0
            cmdline-tools-latest
          ]);

        commonPackages = with pkgs; [
          pnpm_10
          nodejs_22

          pkg-config
          gobject-introspection
          cargo
        ];

        rustToolchain = pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml;
        androidRustToolchain = rustToolchain.override {
          targets = [
            "aarch64-linux-android"
            "armv7-linux-androideabi"
            "x86_64-linux-android"
            "i686-linux-android"
          ];
        };

        frontend = pkgs.callPackage ./nix/frontend.nix {};
      in {
        packages = {
          inherit frontend;
          android = pkgs.callPackage ./nix/android.nix {
            inherit pkgs android-nixpkgs frontend;
          };
          android-release = pkgs.callPackage ./nix/android.nix {
            inherit pkgs android-nixpkgs frontend;
            release = true;
          };
        };

        devShells = {
          default = pkgs.mkShell {
            packages = commonPackages ++ [rustToolchain];
          };

          android = pkgs.mkShell rec {
            packages =
              commonPackages
              ++ [
                androidSdk
                pkgs.zulu # for app signing
                androidRustToolchain
              ];

            JAVA_HOME = "${pkgs.jdk17}";
            ANDROID_SDK_ROOT = "${androidSdk}/share/android-sdk";
            ANDROID_HOME = ANDROID_SDK_ROOT;
            NDK_HOME = "${ANDROID_HOME}/ndk/29.0.14206865";
            GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${androidSdk}/share/android-sdk/build-tools/35.0.0/aapt2";
          };

          signing = pkgs.mkShell {
            packages = [
              signingSdk
              pkgs.jdk17
            ];

            ANDROID_SDK_ROOT = "${signingSdk}/share/android-sdk";
            ANDROID_HOME = "${signingSdk}/share/android-sdk";

            shellHook = ''
              export PATH="$ANDROID_SDK_ROOT/build-tools/36.0.0:$PATH"
              export ANDROID_AVD_HOME="$HOME/.config/.android/avd"
            '';
          };
        };
      }
    );
}
