/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true, // Required for static exports
  },
  // Empty turbopack config to acknowledge Turbopack usage
  turbopack: {},
  webpack: (config, { isServer }) => {
    // This ensures that the @ alias works in both development and production
    config.resolve.alias = {
      ...config.resolve.alias,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "@": require("path").resolve(__dirname, "src"),
    };

    // Configure WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Add rule for .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // WASM files should be treated as assets
    if (!isServer) {
      config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
    }

    return config;
  },
  // Add any other Next.js configurations here
};

module.exports = nextConfig;
