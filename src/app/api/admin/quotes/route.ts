// src/app/api/admin/quotes/route.ts
import { NextRequest } from 'next/server'
import { requireRole, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminUpsertQuote } from '@/services'
import { quoteSchema } from '@/lib/validation/sections'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireRole('editor')
    const supabase = await createClient()
    const { data, error } = await supabase.from('quotes').select('*').order('sort_order')
    if (error) throw error
    return successResponse(data)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole('editor')
    const body = quoteSchema.parse(await req.json())
    const quote = await adminUpsertQuote(body as any)
    return successResponse(quote, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
