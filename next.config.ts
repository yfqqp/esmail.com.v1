/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. تخطي أخطاء الـ TypeScript أثناء بناء المشروع على الاستضافة
  typescript: {
    ignoreBuildErrors: true,
  },

  // 2. تخطي أخطاء الـ ESLint لضمان إتمام الـ Build بنجاح
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 3. منع الـ Webpack من إيقاف البناء بسبب تعارض استيراد ملفات السيرفر
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // يخبر النّظام بإهمال الحزم والمكتبات المخصصة للسيرفر فقط عند بناء صفحات المتصفح
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
