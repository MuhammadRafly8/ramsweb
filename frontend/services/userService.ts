import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const userService = {
  getAllUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  updateUserRole: async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const response = await axios.put(`${API_URL}/api/auth/users/role`, { userId, newRole });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },
  
  updateUsername: async (userId: string, newUsername: string) => {
    try {
      const response = await axios.put(`${API_URL}/api/auth/users/username`, { 
        userId, 
        newUsername 
      });
      return response.data;
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  },
  
  updatePassword: async (userId: string, newPassword: string) => {
    try {
      const response = await axios.put(`${API_URL}/api/auth/users/password`, { 
        userId, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  },
  
  createUser: async (userData: {
    username: string;
    email: string;
    password: string;
    role: string;
  }) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/users`, userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  deleteUser: async (userId: string) => {
    try {
      const response = await axios.delete(`${API_URL}/api/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
};