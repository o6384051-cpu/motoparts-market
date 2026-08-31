const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const isCi = process.env.CI === "true";

module.exports = withNativeWind(config, {
  input: "./global.css",
  // NativeWind's disk cache is useful during local development but can
  // produce an unreadable Metro SHA-1 entry on clean CI runners.
  forceWriteFileSystem: !isCi,
});
