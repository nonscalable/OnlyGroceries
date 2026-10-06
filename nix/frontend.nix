{
  lib,
  stdenvNoCC,
  nodejs_22,
  pnpm_10,
  pnpmConfigHook,
  fetchPnpmDeps,
}:
stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "onlygroceries-frontend";
  version = "0.1.0";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../package.json
      ../pnpm-lock.yaml
      ../pnpm-workspace.yaml
      ../web
    ];
  };

  pnpmWorkspaces = ["@onlygroceries/web"];

  pnpmDeps = fetchPnpmDeps {
    inherit (finalAttrs) pname version src;
    inherit (finalAttrs) pnpmWorkspaces;
    pnpm = pnpm_10;
    fetcherVersion = 3;
    hash = "sha256-Gd/eA4HBFxL9jDq5kGbACFq+07L5yuhv9LQCV8++c0o=";
  };

  nativeBuildInputs = [
    nodejs_22
    pnpm_10
    pnpmConfigHook
  ];

  buildPhase = ''
    runHook preBuild
    pnpm --filter @onlygroceries/web build
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall
    mkdir -p $out
    cp -r web/dist/. $out/
    runHook postInstall
  '';

  meta = {
    description = "OnlyGroceries web frontend";
    platforms = lib.platforms.all;
  };
})
