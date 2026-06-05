/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@vectorize-io/hindsight-client", "groq-sdk"]
  }
};

export default nextConfig;
