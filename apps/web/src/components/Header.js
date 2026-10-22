'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { toast } from 'sonner';

function Avatar({ name }) {
  const initial = name?.[0]?.toUpperCase() ?? '?';
  return (
    <span className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
      {initial}
    </span>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    setMenuOpen(false);
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleSignOut() {
    setMenuOpen(false);
    signOut();
    router.push('/');
  }

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    let cancelled = false;
    
    async function fetchUnread() {
      try {
        // Use API_URL from environment to avoid CSP issues
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mycampusmarket.shop';
        const res = await fetch(`${apiUrl}/api/chat/unread-count`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('ms.accessToken') || ''}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        
        if (!cancelled) {
          const newCount = data?.count || 0;
          if (newCount > prevCountRef.current) {
            toast.info('📩 You have a new message!');
          }
          setUnreadCount(newCount);
          prevCountRef.current = newCount;
        }
      } catch (err) {}
    }
    
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user, pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-extrabold text-lg">
              M
            </span>
            <span className="hidden sm:inline text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
              Market<span className="text-brand-600">Store</span>
            </span>
          </Link>

          {/* Search (hidden on mobile) */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <SearchInput />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {user ? (
              <>
                {/* Messages */}
                <Link
                  href="/messages"
                  aria-label="Messages"
                  className="relative hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  💬
                  {unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : null}
                </Link>
                {/* Orders */}
                <Link
                  href="/orders"
                  aria-label="Orders"
                  className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  📦
                </Link>

                {/* Avatar + dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Avatar name={user.full_name} />
                    <span className="hidden sm:inline text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {user.full_name?.split(' ')[0]}
                    </span>
                  </button>

                  {menuOpen ? (
                    <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-dropdown border border-gray-100 dark:border-gray-800 overflow-hidden animate-slide-down">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <MenuLink href="/items/new" icon="➕">
                        Post item
                      </MenuLink>
                      <MenuLink href="/orders" icon="📦">
                        My orders
                      </MenuLink>
                      <MenuLink href="/my-listings" icon="🏪">
                        My listings
                      </MenuLink>
                      <MenuLink href="/messages" icon="💬">
                        Messages
                      </MenuLink>
                      <MenuLink href="/settings" icon="⚙️">
                        Settings
                      </MenuLink>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-3"
                      >
                        <span>🚪</span> Sign out
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* Sign in is now the primary button for mobile */}
                <Link
                  href="/register"
                  className="hidden sm:inline-flex text-sm font-semibold text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Sign up
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-semibold px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
                >
                  Sign in
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-3">
          <SearchInput />
        </div>

        {/* Mobile nav */}
        {mobileNavOpen ? (
          <nav className="md:hidden border-t border-gray-100 dark:border-gray-800 py-3 space-y-1 animate-slide-down">
            <MobileLink href="/">🏠 Home</MobileLink>
            <MobileLink href="/messages">💬 Messages</MobileLink>
            <MobileLink href="/orders">📦 Orders</MobileLink>
            <MobileLink href="/my-listings">🏪 My Listings</MobileLink>
            <MobileLink href="/items/new">➕ Post item</MobileLink>
            {!user ? (
              <MobileLink href="/login">🔑 Sign in</MobileLink>
            ) : null}
          </nav>
        ) : null}
      </div>
    </header>
  );
}

function MenuLink({ href, icon, children }) {
  return (
    <Link
      href={href}
      className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
    >
      <span>{icon}</span> {children}
    </Link>
  );
}

function MobileLink({ href, children }) {
  return (
    <Link
      href={href}
      className="block px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {children}
    </Link>
  );
}

function SearchInput() {
  const router = useRouter();
  const [q, setQ] = useState('');

  function submit(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={submit} className="flex-1 relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        🔍
      </span>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search items, services…"
        className="w-full pl-11 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition"
      />
    </form>
  );
}
