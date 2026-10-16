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
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
            <footer className="text-center text-sm text-gray-500 py-8">
              Market Store · Mulungushi University · Zambia
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
