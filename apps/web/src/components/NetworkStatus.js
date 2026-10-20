'use client';
import { useEffect, useState } from 'react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Set initial state (safely, so it doesn't break Next.js server rendering)
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000); // Hide after 3 seconds
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true); // Keep showing until back online
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-bold text-white transition-all shadow-md ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}>
      {isOnline ? '✅ You are back online!' : '⚠️ No internet connection. Please check your network.'}
    </div>
  );
}
