import { NextRequest, NextResponse } from 'next/server';
import { stateSlug } from '@/lib/seo-pages';

const viewToPath: Record<string, string> = {
  universities: '/universities',
  notices: '/notices',
  entrance: '/entrance',
  board: '/board',
};

const pathToAppView: Record<string, string> = {
  '/universities': 'universities',
  '/notices': 'notices',
  '/entrance': 'entrance',
  '/board': 'board',
};

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  const url = request.nextUrl.clone();

  if (host === 'alluniversity.org') {
    url.protocol = 'https';
    url.hostname = 'www.alluniversity.org';

    const response = NextResponse.redirect(url, 308);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Clear-Site-Data', '"cache", "storage", "executionContexts"');
    return response;
  }

  if (url.pathname === '/') {
    const view = url.searchParams.get('view');
    const state = url.searchParams.get('state');

    if (view && viewToPath[view]) {
      url.pathname = viewToPath[view];
      url.searchParams.delete('view');
      return NextResponse.redirect(url, 308);
    }

    if (state) {
      url.pathname = `/states/${stateSlug(state)}`;
      url.searchParams.delete('state');
      return NextResponse.redirect(url, 308);
    }
  }

  const appView = pathToAppView[url.pathname];

  if (appView) {
    url.pathname = '/';
    url.searchParams.set('view', appView);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
