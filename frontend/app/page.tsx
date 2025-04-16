"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth/authContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Only redirect after authentication check is complete
    if (!isLoading) {
      if (isAuthenticated) {
        // If logged in, redirect to matrix page
        router.push("/matrix");
      } else {
        // If not logged in, redirect to login page
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // This will only show briefly before redirect
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Matrix Consierge</h1>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}