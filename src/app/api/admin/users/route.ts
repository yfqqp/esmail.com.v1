// src/app/api/admin/users/route.ts
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireRole('admin')
    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').select('*').order('created_at')
    if (error) throw error
    return successResponse(data)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}
