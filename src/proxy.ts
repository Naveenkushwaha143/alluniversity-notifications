import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();

  if (host === 'alluniversity.org') {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.hostname = 'www.alluniversity.org';

    const response = NextResponse.redirect(url, 308);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Clear-Site-Data', '"cache", "storage", "executionContexts"');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
