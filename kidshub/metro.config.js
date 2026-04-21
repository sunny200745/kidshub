/**
 * Metro config for kidshub inside the daycares/ npm-workspaces monorepo.
 *
 * The default Expo Metro config assumes node_modules sits next to the app.
 * In a workspace setup, npm hoists shared deps to <monorepoRoot>/node_modules.
 * We tell Metro to (1) watch the whole monorepo for changes and (2) resolve
 * modules from BOTH the app-local and root node_modules folders, then disable
 * hierarchical lookup so Metro doesn't crawl up past the monorepo root.
 *
 * Reference: https://docs.expo.dev/guides/monorepos/
 */
const { getDefaultConfig } = require('expo/metro-config');
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

module.exports = config;
