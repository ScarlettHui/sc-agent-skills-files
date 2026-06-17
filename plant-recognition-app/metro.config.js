const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase modules don't work correctly with Metro's package exports resolver
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
