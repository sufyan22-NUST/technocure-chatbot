/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@anthropic-ai/sdk", "@supabase/supabase-js", "nodemailer"],
  },
};

export default nextConfig;
