// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// دالة العميل العادي المعتمد على الكوكيز (للمستخدمين)
export async function createClient() {
  // استدعاء ديناميكي لمنع الكومبيلر من الاعتراض أثناء الـ Build
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // benign
          }
        },
      },
    }
  )
}

// دالة عميل السيرفر الصلاحيات الكاملة (تتخطى الـ RLS)
export function createServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // التأكد من استخدام السيرفس رول كي هنا
    {
      cookies: { 
        getAll: () => [], 
        setAll: () => {} 
      },
      auth: { 
        persistSession: false 
      },
    }
  )
}
