
'use client';
import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/contexts/auth-provider';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, initialLoadComplete, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Used usePathname

  useEffect(() => {
    if (initialLoadComplete && !loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, initialLoadComplete, router]);

  useEffect(() => {
    if (initialLoadComplete && user && userProfile && !userProfile.coreTasksSet) {
        // If user is logged in, profile loaded, but core tasks not set, redirect.
        // Avoid redirecting if already on core-tasks page.
        if (pathname !== '/core-tasks') { // Used pathname here
             router.replace('/core-tasks');
        }
    }
  }, [user, userProfile, initialLoadComplete, router, pathname]); // Added pathname to dependencies


  if (loading || !initialLoadComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="space-y-4 w-full max-w-xs">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }
  
  if (!user && initialLoadComplete) { // Ensure initialLoad is complete before this check
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback, show a message or redirect.
    // If already on /login, no need to show this, the useEffect handles it.
    if (pathname !== '/login') {
        return (
             <div className="flex min-h-screen flex-col items-center justify-center">
                <p>Redirecting to login...</p>
             </div>
        );
    }
    // If on /login and user is null, AuthLayout will render the login form.
    // So, no explicit rendering here is needed if already on /login.
  }


  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} FocusFlow. All rights reserved.
      </footer>
    </div>
  );
}

