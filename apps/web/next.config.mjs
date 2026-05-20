/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cambium/shared", "@cambium/api"],
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
  webpack(config) {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
