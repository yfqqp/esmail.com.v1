// src/app/api/admin/quotes/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, AuthError, successResponse, errorResponse } from '@/lib/auth/helpers'
import { adminGetAllQuotes, adminUpsertQuote } from '@/services'
import { quoteSchema } from '@/lib/validation/sections'

export async function GET() {
  try {
    await requireAuth()
    const quotes = await adminGetAllQuotes()
    return successResponse(quotes)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse('Unknown error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = quoteSchema.parse(await req.json())
    const quote = await adminUpsertQuote(body as any)
    return successResponse(quote, 201)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.statusCode)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 400)
  }
}
