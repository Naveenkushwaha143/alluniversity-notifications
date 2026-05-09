import { SiteChrome } from '@/components/site-chrome';
import type { ReactNode } from 'react';

export default function SeoPagesLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
