import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'TaskFlow — планируй. выполняй. развивайся.',
  description: 'TaskFlow — единое пространство для задач, проектов, привычек, целей и фокус-режима.',
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#070a12',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} themes={["light", "dark", "ocean", "forest", "crimson", "violet"]}>
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
