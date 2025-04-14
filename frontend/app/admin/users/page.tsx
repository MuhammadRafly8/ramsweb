"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../../../components/auth/authContext";
import AdminRoute from "../../../components/auth/adminRoute";
import { userService } from "../../../services/userService";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToUpdatePassword, setUserToUpdatePassword] = useState<string | null>(null);
  const [userToUpdateUsername, setUserToUpdateUsername] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  
  useEffect(() => {
    // Redirect if not admin
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (!isAdmin()) {
      router.push('/');
      return;
    }
    
    fetchUsers();
  }, [isAuthenticated, isAdmin, router]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await userService.updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success(`User role updated to ${newRole} successfully`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const createUser = async () => {
    try {
      if (!newUser.username || !newUser.email || !newUser.password) {
        toast.error('Username, email, and password are required');
        return;
      }

      const response = await userService.createUser(newUser);
      
      // Add new user to the list
      setUsers([...users, response.user]);
      
      // Reset form and close modal
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      setShowCreateModal(false);
      
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Fix the type error by using AxiosError type
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create user');
      }
    }
  };

  const initiateDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await userService.deleteUser(userToDelete);
      
      // Remove user from the list
      setUsers(users.filter(user => user.id !== userToDelete));
      
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const initiateUpdatePassword = (userId: string) => {
    setUserToUpdatePassword(userId);
    setNewPassword("");
    setShowPasswordModal(true);
  };

  const updatePassword = async () => {
    if (!userToUpdatePassword || !newPassword.trim()) {
      toast.error('Password cannot be empty');
      return;
    }
    
    try {
      await userService.updatePassword(userToUpdatePassword, newPassword);
      
      toast.success('Password updated successfully');
      setShowPasswordModal(false);
      setUserToUpdatePassword(null);
      setNewPassword("");
    } catch (error) {
      console.error('Error updating password:', error);
      
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to update password');
      }
    }
  };

  const initiateUpdateUsername = (userId: string, currentUsername: string) => {
    setUserToUpdateUsername(userId);
    setNewUsername(currentUsername);
    setShowUsernameModal(true);
  };

  const updateUsername = async () => {
    if (!userToUpdateUsername || !newUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    
    try {
      await userService.updateUsername(userToUpdateUsername, newUsername);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userToUpdateUsername ? { ...user, username: newUsername } : user
      ));
      
      toast.success('Username updated successfully');
      setShowUsernameModal(false);
      setUserToUpdateUsername(null);
      setNewUsername("");
    } catch (error) {
      console.error('Error updating username:', error);
      
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to update username');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Create User
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Username</th>
                  <th className="py-2 px-4 border-b text-left">Email</th>
                  <th className="py-2 px-4 border-b text-left">Role</th>
                  <th className="py-2 px-4 border-b text-left">Created At</th>
                  <th className="py-2 px-4 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{user.username}</td>
                    <td className="py-2 px-4 border-b">{user.email}</td>
                    <td className="py-2 px-4 border-b">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as 'user' | 'admin')}
                        className="border rounded px-2 py-1"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => initiateUpdateUsername(user.id, user.username)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Edit Username
                        </button>
                        <button
                          onClick={() => initiateUpdatePassword(user.id)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => initiateDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New User</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={createUser}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p>Are you sure you want to delete this user? This action cannot be undone.</p>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteUser}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Reset Password</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={updatePassword}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Username Modal */}
        {showUsernameModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Username</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowUsernameModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={updateUsername}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Update Username
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}
  