import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate WS/TipTap collaboration mounts during development
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: path.resolve('./node_modules/yjs'),
    };
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
};

export default nextConfig;
