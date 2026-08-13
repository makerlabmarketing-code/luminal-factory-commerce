import type { NextConfig } from "next";

function getSupabaseHostname(): string | undefined {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!configuredUrl) return undefined;

  try {
    const url = new URL(configuredUrl);
    return url.protocol === "https:" ? url.hostname : undefined;
  } catch {
    return undefined;
  }
}

const supabaseHostname = getSupabaseHostname();

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
