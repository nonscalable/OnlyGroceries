{
  lib,
  stdenvNoCC,
  pkgs,
  android-nixpkgs,
  frontend,
  release ? false,
}: let
  buildMode =
    if release
    then "release"
    else "debug";

  apkSource =
    if release
    then "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk"
    else "src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk";

  androidSdk = android-nixpkgs.sdk.${stdenvNoCC.hostPlatform.system} (
    sdkPkgs:
      with sdkPkgs; [
        build-tools-35-0-0
        build-tools-36-0-0
        cmdline-tools-latest
        platform-tools
        platforms-android-36
        ndk-29-0-14206865
      ]
  );

  rustToolchain = (pkgs.rust-bin.fromRustupToolchainFile ../rust-toolchain.toml).override {
    targets = [
      "aarch64-linux-android"
      "armv7-linux-androideabi"
      "x86_64-linux-android"
      "i686-linux-android"
    ];
  };

  tauriSettingsGradle = pkgs.writeText "tauri.settings.gradle" ''
    include ':tauri-android'
    project(':tauri-android').projectDir = new File(rootDir, 'tauri-android')
  '';

  tauriBuildGradle = pkgs.writeText "tauri.build.gradle.kts" ''
    val implementation by configurations
    dependencies {
      implementation(project(":tauri-android"))
    }
  '';

  tauriProperties = pkgs.writeText "tauri.properties" ''
    tauri.android.versionName=0.1.0
    tauri.android.versionCode=1000
  '';

  tauriBuildConfig = pkgs.writeText "tauri.nix.conf.json" (builtins.toJSON {
    build.beforeBuildCommand = "";
  });

  # The stock Gradle dependency task resolves Android's internal project
  # configurations directly, where variant selection is intentionally
  # ambiguous. Copying them without project dependencies still records every
  # external Maven artifact; local projects are already present in the source.
  externalGradleDeps = pkgs.writeText "external-deps.gradle" ''
    gradle.projectsLoaded {
      rootProject.allprojects {
        tasks.register("nixDownloadExternalDeps") {
          doLast {
            configurations.findAll { it.canBeResolved }.each { configuration ->
              configuration.copyRecursive {
                !(it instanceof org.gradle.api.artifacts.ProjectDependency)
              }.resolve()
            }
            buildscript.configurations.findAll { it.canBeResolved }.each {
              it.resolve()
            }
          }
        }
      }
    }
  '';

  reproducibleGradleBuild = pkgs.writeText "reproducible-build.gradle" ''
    gradle.projectsLoaded {
      rootProject.allprojects {
        tasks.withType(AbstractArchiveTask) {
          preserveFileTimestamps = false
          reproducibleFileOrder = true
        }
      }
    }
  '';

  # Tauri invokes the checked-in Gradle wrapper in a child process. Keep that
  # interface while forwarding Nix's deterministic Gradle and replay cache.
  gradleWrapper = pkgs.writeShellScript "gradlew" ''
    proxyArgs=(--offline)
    if [[ -n "''${MITM_CACHE_HOST:-}" ]]; then
      proxyArgs=(
        -Dhttp.proxyHost="$MITM_CACHE_HOST"
        -Dhttp.proxyPort="$MITM_CACHE_PORT"
        -Dhttps.proxyHost="$MITM_CACHE_HOST"
        -Dhttps.proxyPort="$MITM_CACHE_PORT"
        -Djavax.net.ssl.trustStore="$MITM_CACHE_KEYSTORE"
        -Djavax.net.ssl.trustStorePassword="$MITM_CACHE_KS_PWD"
      )
    fi

    exec ${pkgs.gradle_8}/bin/gradle \
      --no-daemon \
      --console plain \
      --init-script ${reproducibleGradleBuild} \
      "''${proxyArgs[@]}" \
      "$@"
  '';
in
  stdenvNoCC.mkDerivation (finalAttrs: {
    pname = "onlygroceries-android-${buildMode}";
    version = "0.1.0";

    src = lib.fileset.toSource {
      root = ../.;
      fileset = ../src-tauri;
    };

    cargoRoot = "src-tauri";
    cargoDeps = pkgs.rustPlatform.importCargoLock {
      lockFile = ../src-tauri/Cargo.lock;
    };

    mitmCache = pkgs.gradle_8.fetchDeps {
      pkg = finalAttrs.finalPackage;
      data = ./android-gradle-deps.json;
    };

    nativeBuildInputs = [
      androidSdk
      pkgs.cargo-tauri
      pkgs.gradle_8
      pkgs.jdk17
      rustToolchain
      pkgs.rustPlatform.cargoSetupHook
    ];

    JAVA_HOME = pkgs.jdk17;
    ANDROID_SDK_ROOT = "${androidSdk}/share/android-sdk";
    ANDROID_HOME = finalAttrs.ANDROID_SDK_ROOT;
    NDK_HOME = "${finalAttrs.ANDROID_HOME}/ndk/29.0.14206865";
    GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${finalAttrs.ANDROID_HOME}/build-tools/36.0.0/aapt2";
    gradleFlags = "--project-dir=src-tauri/gen/android --init-script=${externalGradleDeps}";
    gradleUpdateTask =
      "nixDownloadExternalDeps"
      + lib.optionalString release " :tauri-android:extractReleaseAnnotations";

    preConfigure = ''
      export ANDROID_USER_HOME="$TMPDIR/.android"
      mkdir -p "$ANDROID_USER_HOME"
    '';

    postConfigure = ''
      export MITM_CACHE_HOST MITM_CACHE_PORT
      export MITM_CACHE_KEYSTORE MITM_CACHE_KS_PWD
    '';

    postPatch = ''
      rm -rf web/dist
      mkdir -p web/dist
      cp -r ${frontend}/. web/dist/

      substituteInPlace \
        src-tauri/gen/android/buildSrc/src/main/java/coop/nonscalable/onlygroceries/kotlin/BuildTask.kt \
        --replace-fail \
          'val executable = """pnpm""";' \
          'val executable = """cargo""";'

      cp -r ${finalAttrs.cargoDeps}/tauri-2.9.5/mobile/android \
        src-tauri/gen/android/tauri-android
      chmod -R u+w src-tauri/gen/android/tauri-android

      install -Dm644 ${tauriSettingsGradle} \
        src-tauri/gen/android/tauri.settings.gradle
      install -Dm644 ${tauriBuildGradle} \
        src-tauri/gen/android/app/tauri.build.gradle.kts
      install -Dm644 ${tauriProperties} \
        src-tauri/gen/android/app/tauri.properties
      install -Dm755 ${gradleWrapper} src-tauri/gen/android/gradlew
    '';

    buildPhase = ''
      runHook preBuild

      cargo metadata \
        --offline \
        --locked \
        --format-version 1 \
        --manifest-path src-tauri/Cargo.toml \
        > cargo-metadata.json

      cargo tauri android build ${lib.optionalString (!release) "--debug"} \
        --target aarch64 \
        --config ${tauriBuildConfig} \
        --apk true \
        --aab false \
        --ci

      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall

      install -Dm644 \
        ${apkSource} \
        $out/onlygroceries-arm64-${buildMode}${lib.optionalString release "-unsigned"}.apk
      install -Dm644 cargo-metadata.json $out/share/onlygroceries/cargo-metadata.json
      cp -r ${frontend} $out/share/onlygroceries/web

      runHook postInstall
    '';

    meta = {
      description = "OnlyGroceries Android ${buildMode} APK";
      platforms = lib.platforms.linux;
    };
  })
