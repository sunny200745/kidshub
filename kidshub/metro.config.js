/**
 * Metro config for kidshub.
 *
 * Two layers stacked here:
 *   1. Monorepo support — daycares/ uses npm workspaces, so Metro must watch
 *      the whole monorepo and resolve modules from BOTH the app-local and the
 *      hoisted root node_modules. Standard Expo monorepo template:
 *      https://docs.expo.dev/guides/monorepos/
 *   2. NativeWind — wraps the config to enable Tailwind class transformation
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

module.exports = withNativeWind(config, { input: './global.css' });
