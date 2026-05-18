'use client';

import { ThemeProvider } from 'next-themes';
import { ThemeToaster } from '@/components/theme-toaster';
import AdminClient from './admin-client';

export default function AdminPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={true}>
      <AdminClient />
      <ThemeToaster />
    </ThemeProvider>
  );
}
