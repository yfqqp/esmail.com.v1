import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  // Tell Next.js/webpack to treat `pg` and its companion packages as
  // external to the server bundle — require() them at runtime from
  // node_modules rather than bundling them. This is the correct fix for
  // two pg-on-Vercel issues:
  //
  // 1. "Module not found: pg-native" warning: pg optionally tries to load
  //    a compiled native addon. It's absent on Vercel's serverless sandbox,
  //    so webpack emits a warning when it encounters this optional require
  //    while trying to bundle pg. Externalising pg means webpack never
  //    bundles it and never hits the optional require path.
  //
  // 2. Edge-bundle contamination safety net: if a future import chain ever
  //    accidentally reaches pg from an Edge-runtime file, webpack will emit
  //    a clear build-time error rather than silently trying to polyfill
  //    Node built-ins (net, tls, dns, fs) into a broken bundle.
  //
  // This is NOT a workaround for the session.ts Edge-bundling bug fixed by
  // splitting into session-edge.ts / session-server.ts. That was an
  // architectural fix. This is standard, correct pg-on-Next.js practice.
  serverExternalPackages: ['pg', 'pg-pool', 'pg-connection-string'],

  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? [process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, '')]
          : []),
      ],
    },
  },
}

export default withNextIntl(nextConfig)
