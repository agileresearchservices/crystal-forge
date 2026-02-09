import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ConnectionProvider } from '@/context/ConnectionContext';
import { QueryProvider } from '@/context/QueryContext';
import { ThemeProvider } from '@/context/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Crystal Forge - OpenSearch Query Builder',
  description: 'Visual query builder for OpenSearch',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <ConnectionProvider>
            <QueryProvider>{children}</QueryProvider>
          </ConnectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
