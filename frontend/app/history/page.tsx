"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/authContext';
import HistoryTable from '../../components/history/historyTable';

export default function HistoryPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  // Add this at the top of your component
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // First, check if authentication state has been determined
    if (!authChecked && isAuthenticated !== undefined) {
      setAuthChecked(true);
    }
    
    // Only redirect if authentication has been checked and user is not authenticated
    if (authChecked && isAuthenticated === false) {
      router.push('/auth/login');
      return;
    }
    
    // Only check admin status if user is authenticated
    if (authChecked && isAuthenticated && !isAdmin()) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, isAdmin, router, authChecked]);

  // Update the conditional rendering
  if (!authChecked || (authChecked && !isAuthenticated) || (authChecked && isAuthenticated && !isAdmin())) {
    return null;
  }

  return (
    <main className="flex-grow container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Change History</h2>
        <div className="mb-4">
          <p className="text-gray-600">
            This page shows the history of all changes made to the dependency matrices.
            Each entry includes the user who made the change, the affected matrix, and the action taken.
          </p>
        </div>
        <HistoryTable />
      </div>
    </main>
  );
}