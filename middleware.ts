import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/api/auth', '/api/webhooks']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const session = req.cookies.get('mnemo_session')

  if (!isPublic && !session) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
