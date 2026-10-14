import './globals.css';
import Header from '@/components/Header';
import AuthProvider from '@/components/AuthProvider';

export const metadata = {
  title: 'Market Store — Mulungushi University',
  description: 'Buy and sell on campus. Delivery in minutes.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
          <footer className="text-center text-sm text-gray-500 py-8">
            Market Store · Mulungushi University · Zambia
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
