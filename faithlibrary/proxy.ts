// proxy.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/upload', '/dashboard', '/edit', '/settings', '/bulk-upload']
const AUTH_ONLY = ['/login', '/signup']

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isAuthPage  = AUTH_ONLY.some(r => pathname === r || pathname.startsWith(r + '/'))

  if (!isProtected && !isAuthPage) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): { name: string; value: string }[] {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ): void {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/upload',
    '/upload/(.*)',
    '/dashboard',
    '/dashboard/(.*)',
    '/edit/(.*)',
    '/settings',
    '/settings/(.*)',
    '/bulk-upload',
    '/login',
    '/signup',
  ],
}