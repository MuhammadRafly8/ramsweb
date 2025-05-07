"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/auth/authContext';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Jika sudah login, cek apakah ada redirectMatrixId
    if (!isLoading && isAuthenticated) {
      const redirectMatrixId = localStorage.getItem('redirectMatrixId');
      
      if (redirectMatrixId) {
        // Hapus redirectMatrixId dari localStorage
        localStorage.removeItem('redirectMatrixId');
        // Redirect ke halaman matrix yang dimaksud
        router.push(`/matrix/${redirectMatrixId}`);
      } else {
        // Jika tidak ada redirectMatrixId, arahkan ke halaman utama
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Username dan password diperlukan');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      // Redirect akan ditangani oleh useEffect di atas
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login gagal. Periksa username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  // Jika sudah login, tampilkan loading (redirect akan ditangani oleh useEffect)
  if (!isLoading && isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center">Redirecting...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="mt-2 text-gray-600">Masuk ke akun Anda</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}