'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const { user, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const router = useRouter();

  function handleSignOut() {
    signOut();
    router.push('/');
  }

  return (
    <header className="bg-white dark:bg-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-xl font-extrabold text-brand-600">
          Market Store
        </Link>
        <nav className="flex-1 flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-brand-600">Browse</Link>
          {user ? (
            <>
              <Link href="/items/new" className="text-gray-700 dark:text-gray-300 hover:text-brand-600">Post item</Link>
              <Link href="/orders" className="text-gray-700 dark:text-gray-300 hover:text-brand-600">Orders</Link>
            </>
          ) : null}
        </nav>

        <button
          onClick={toggle}
          className="text-lg"
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">{user.full_name}</span>
            <button onClick={handleSignOut} className="text-sm text-red-600 font-semibold">Sign out</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-brand-600 text-white">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
}
