"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MatrixTable from '../../components/matrix/matrixTable';
import { useAuth } from '../../components/auth/authContext';

export default function MatrixPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render anything until authentication check is complete
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="flex-grow container mx-auto p-2 md:p-4">
      <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Dependency Matrix</h2>
        <div className="overflow-x-auto">
          <MatrixTable />
        </div>
      </div>
    </main>
  );
}