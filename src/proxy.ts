import { NextRequest, NextResponse } from 'next/server';
import { stateSlug } from '@/lib/seo-pages';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.pathname === '/') {
    const state = url.searchParams.get('state');

    if (state) {
      url.pathname = `/states/${stateSlug(state)}`;
      url.searchParams.delete('state');
      return NextResponse.redirect(url, 308);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
