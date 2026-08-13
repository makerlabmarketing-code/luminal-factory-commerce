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
  // Vercel injects a build adapter that is incompatible with standalone output
  // in Next 16.3. Keep standalone artifacts only for self-hosted builds.
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
