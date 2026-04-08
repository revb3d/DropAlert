const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// On web, swap react-native-reanimated for its official stub.
// We don't use any Reanimated animations, so this is safe —
// it avoids Node.js-only build code (path.join etc.) crashing in Electron.
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-reanimated') {
    return {
      filePath: require.resolve('react-native-reanimated/mock'),
      type: 'sourceFile',
    };
  }
  // expo-modules-core uses native initialization that crashes in Electron/web.
  // Swap it for a minimal stub that satisfies expo-font, expo-constants, etc.
  if (platform === 'web' && moduleName === 'expo-modules-core') {
    return {
      filePath: path.resolve(__dirname, 'src/mocks/expo-modules-core.js'),
      type: 'sourceFile',
    };
  }
  return upstream
    ? upstream(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
