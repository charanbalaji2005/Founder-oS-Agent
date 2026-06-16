const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Block backend folder from being bundled
const defaultBlockList = config.resolver.blockList;
const customPattern = /[\\/\\\\]backend[\\/\\\\]/;

if (defaultBlockList instanceof RegExp) {
  config.resolver.blockList = new RegExp(
    `(${customPattern.source})|(${defaultBlockList.source})`
  );
} else if (Array.isArray(defaultBlockList)) {
  config.resolver.blockList = [customPattern, ...defaultBlockList];
} else {
  config.resolver.blockList = customPattern;
}

// Mock Node.js modules that React Native doesn't support
const mockPath = path.resolve(__dirname, 'metro-mock.js');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,

  fs: mockPath,
  path: mockPath,
  os: mockPath,
  tty: mockPath,
  net: mockPath,
  tls: mockPath,
  crypto: mockPath,
  stream: mockPath,
  zlib: mockPath,
  http: mockPath,
  https: mockPath,
  child_process: mockPath,
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('websocket.node.js') || moduleName.endsWith('websocket.node')) {
    const newModuleName = moduleName.replace('websocket.node', 'websocket');
    return context.resolveRequest(context, newModuleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;