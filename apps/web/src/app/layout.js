import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
const inter = Inter({ subsets: ['latin'] });
import './globals.css';
import Header from '@/components/Header';
import AuthProvider from '@/components/AuthProvider';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata = {
  title: 'Market Store — Mulungushi University',
  description: 'Buy and sell on campus. Delivery in minutes.',
  manifest: '/manifest.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#059669'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen antialiased"}>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="max-w-6xl mx-auto px-4 py-6">{children}

        <Toaster 
          position="top-right" 
          expand={false} 
          richColors 
          closeButton
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              color: '#0f172a',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
            className: 'dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100'
          }}
        />
</main>
            <footer className="text-center text-sm text-gray-500 py-8">
              Market Store · Mulungushi University · Zambia
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
