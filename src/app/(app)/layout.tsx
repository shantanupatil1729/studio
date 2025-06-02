'use client';
import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/contexts/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, initialLoadComplete, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialLoadComplete && !loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, initialLoadComplete, router]);

  useEffect(() => {
    if (initialLoadComplete && user && userProfile && !userProfile.coreTasksSet) {
        // If user is logged in, profile loaded, but core tasks not set, redirect.
        // Avoid redirecting if already on core-tasks page.
        if (router.pathname !== '/core-tasks') { 
             router.replace('/core-tasks');
        }
    }
  }, [user, userProfile, initialLoadComplete, router]);


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
  
  if (!user) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback, show a loading or minimal state.
    return (
         <div className="flex min-h-screen flex-col items-center justify-center">
            <p>Redirecting to login...</p>
         </div>
    );
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