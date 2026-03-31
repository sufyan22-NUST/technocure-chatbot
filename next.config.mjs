/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify's plugin handles output; don't force "standalone" here.

  // Prevent API keys leaking into the browser bundle
  experimental: {
    serverComponentsExternalPackages: ["@anthropic-ai/sdk", "@supabase/supabase-js"],
  },

  // Strict mode helps catch potential React issues early
  reactStrictMode: true,
};

export default nextConfig;
