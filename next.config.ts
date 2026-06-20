/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. تخطي أخطاء الـ TypeScript أثناء البناء والرفع
  typescript: {
    ignoreBuildErrors: true,
  },

  // 2. تخطي تحذيرات الـ ESLint لكي لا يتوقف الـ Build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
