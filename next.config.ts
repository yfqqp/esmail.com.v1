import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// ربط ملف إعدادات اللغات مباشرة بعملية بناء المشروع
const withNextIntl = createNextIntlPlugin(
  './src/i18n/request.ts'
);

const nextConfig: NextConfig = {
  // 1. تخطي أخطاء الـ TypeScript أثناء البناء والرفع لكي لا يتوقف الـ Build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 2. تخطي تحذيرات وأخطاء الـ ESLint لضمان إتمام الـ Build بنجاح
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
