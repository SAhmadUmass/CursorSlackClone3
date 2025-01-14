/**
 * @deprecated This endpoint is deprecated. Please use /api/conversations/[id]/messages?type=dm instead.
 * This route is kept for backward compatibility and will be removed in a future version.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  console.warn('DEPRECATED: Using /api/dm-channels/[channelId]/messages is deprecated. Please use /api/conversations/[id]/messages?type=dm instead.')
  
  // Redirect to the new endpoint
  const url = new URL(req.url)
  const redirectUrl = new URL(`/api/conversations/${params.channelId}/messages?type=dm`, url.origin)
  return NextResponse.redirect(redirectUrl)
}

export async function POST(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  console.warn('DEPRECATED: Using /api/dm-channels/[channelId]/messages is deprecated. Please use /api/conversations/[id]/messages?type=dm instead.')
  
  // Redirect to the new endpoint
  const url = new URL(req.url)
  const redirectUrl = new URL(`/api/conversations/${params.channelId}/messages?type=dm`, url.origin)
  return NextResponse.redirect(redirectUrl)
}
