/**
 * Metro config for kidshub.
 *
 * Three layers stacked here:
 *   1. Monorepo support — daycares/ uses npm workspaces, so Metro must watch
 *      the whole monorepo and resolve modules from BOTH the app-local and the
 *      hoisted root node_modules. Standard Expo monorepo template:
 *      https://docs.expo.dev/guides/monorepos/
 *   2. Firebase Auth RN bundle pinning — Expo SDK 54's Metro has
 *      `unstable_enablePackageExports = true` by default. With Firebase JS
 *      SDK 10.x that resolution path lands on the wrong @firebase/auth bundle
 *      on native (Node bundle has no `registerAuth("ReactNative")` side effect
 *      and no getReactNativePersistence export), causing
 *      "Component auth has not been registered yet" when calling
 *      initializeAuth.
 *
 *      The documented fix is to disable package exports so Metro falls back
 *      to legacy resolverMainFields. Both @firebase/auth and firebase/auth
 *      have a top-level `react-native` field pointing at the correct RN
 *      bundle (dist/rn/index.js), which exports getReactNativePersistence
 *      AND fires registerAuth("ReactNative") as a side effect.
 *
 *      Plus: a resolveRequest override pins those two specifiers to the RN
 *      bundle's absolute path on native as a belt-and-suspenders guarantee
 *      regardless of what other plugins (NativeWind, expo/metro-config, etc.)
 *      do to resolver fields downstream.
 *   3. NativeWind — wraps the config to enable Tailwind class transformation
 *      and processes ./global.css as the entry stylesheet.
 */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

// Layer 2a: disable package-exports resolution so Metro uses legacy fields
// (resolverMainFields). @firebase/auth's legacy `react-native` field points
// at dist/rn/index.js, which is the bundle we actually need on native.
config.resolver.unstable_enablePackageExports = false;

// Layer 2b: hard-pin @firebase/auth and firebase/auth to the RN bundle on
// native, defensive against any other plugin re-enabling package-exports
// or shuffling main fields downstream.
const firebaseAuthRnBundle = path.resolve(
  monorepoRoot,
  'node_modules/@firebase/auth/dist/rn/index.js',
);

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && (moduleName === '@firebase/auth' || moduleName === 'firebase/auth')) {
    return { type: 'sourceFile', filePath: firebaseAuthRnBundle };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
