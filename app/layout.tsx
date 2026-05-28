import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ЦСОП Варна — Деловодна система',
  description: 'Деловодна система на ЦСОП Варна',
  openGraph: {
    title: 'ЦСОП Варна — Деловодна система',
    description: 'Деловодна система на ЦСОП Варна',
    images: [{ url: 'https://delo.csop-varna.bg/CsopLOGO.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: 'https://delo.csop-varna.bg/CsopLOGO.jpg' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
