/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cambium/shared"],
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
