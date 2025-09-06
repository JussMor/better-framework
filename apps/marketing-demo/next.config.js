/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  webpack: (config, { isServer }) => {
    // Prevent bundling native/server-only sqlite implementations into client bundles
    const externals = config.externals || [];
    const sqliteExternals = [
      "node:sqlite",
      "bun:sqlite",
      "better-sqlite3",
    ];

    // Add a function external resolver that marks sqlite modules as external
    config.externals = [
      function ({ request }, callback) {
        if (!request) return callback();
        if (sqliteExternals.includes(request)) {
          return callback(null, "commonjs " + request);
        }
        return callback();
      },
      ...(Array.isArray(externals) ? externals : []),
    ];

    return config;
  },
};

export default nextConfig;
