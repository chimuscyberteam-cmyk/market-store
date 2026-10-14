'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  function handleSignOut() {
    signOut();
    router.push('/');
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-xl font-extrabold text-brand-600">Market Store</Link>
        <nav className="flex-1 flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-700 hover:text-brand-600">Browse</Link>
          {user ? (
            <>
              <Link href="/items/new" className="text-gray-700 hover:text-brand-600">Post item</Link>
              <Link href="/orders" className="text-gray-700 hover:text-brand-600">Orders</Link>
            </>
          ) : null}
        </nav>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">{user.full_name}</span>
            <button onClick={handleSignOut} className="text-sm text-red-600 font-semibold">Sign out</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-semibold text-gray-700">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-brand-600 text-white">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
}
