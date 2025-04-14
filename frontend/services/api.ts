import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Configure axios
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Auth service
const authService = {
  register: async (userData: { username: string; email: string; password: string }) => {
    try {
      console.log('Sending registration request to:', `${API_URL}/api/auth/register`);
      console.log('With data:', { username: userData.username, email: userData.email });
      
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error in service:', error);
      throw error;
    }
  },
  
  login: async (username: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { username, password });
    return response.data;
  },
  
  logout: async () => {
    // Remove token from localStorage
    localStorage.removeItem('authToken');
    return { success: true };
  },
  
  getCurrentUser: async () => {
    try {
      // Cek token di localStorage
      const token = localStorage.getItem('authToken');
      
      // Set token di header jika ada
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API_URL}/api/auth/me`);
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }
};

// Matrix service
const matrixService = {
  getAllMatrices: async () => {
    const response = await axios.get(`${API_URL}/api/matrix`);
    return response.data;
  },
  
  getMatrixById: async (id: string) => {
    const response = await axios.get(`${API_URL}/api/matrix/${id}`);
    return response.data;
  },
  
  createMatrix: async (matrixData: unknown) => {
    const response = await axios.post(`${API_URL}/api/matrix`, matrixData);
    return response.data;
  },
  
  updateMatrix: async (id: string, matrixData: unknown) => {
    const response = await axios.put(`${API_URL}/api/matrix/${id}`, matrixData);
    return response.data;
  },
  
  deleteMatrix: async (id: string) => {
    const response = await axios.delete(`${API_URL}/api/matrix/${id}`);
    return response.data;
  },
  
  // Update the verifyMatrixAccess function
  verifyMatrixAccess: async (id: string, keyword: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/matrix/${id}/verify`, { keyword });
      return response.data;
    } catch (error) {
      console.error('Error verifying matrix access:', error);
      throw error;
    }
  },
  
  // Add the matrix column averages function
  getMatrixColumnAverages: async (matrixId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/matrix/${matrixId}/column-averages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching matrix column averages:', error);
      throw error;
    }
  }
};

// History service
const historyService = {
  // Get all history entries
  getAllHistory: async () => {
    const response = await axios.get(`${API_URL}/api/history`);
    return response.data;
  },

  // Get history entries for a specific matrix
  getHistoryByMatrixId: async (matrixId: string) => {
    const response = await axios.get(`${API_URL}/api/history/matrix/${matrixId}`);
    return response.data;
  },

  // Create a new history entry
  createHistoryEntry: async (entry: unknown) => {
    const response = await axios.post(`${API_URL}/api/history`, entry);
    return response.data;
  },

  // Delete a history entry
  deleteHistoryEntry: async (id: string) => {
    const response = await axios.delete(`${API_URL}/api/history/${id}`);
    return response.data;
  }
};

// User service
const userService = {
  getAllUsers: async () => {
    const response = await axios.get(`${API_URL}/api/users`);
    return response.data;
  },
  
  getUserById: async (id: string) => {
    const response = await axios.get(`${API_URL}/api/users/${id}`);
    return response.data;
  },
  
  updateUser: async (id: string, userData: unknown) => {
    const response = await axios.put(`${API_URL}/api/users/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id: string) => {
    const response = await axios.delete(`${API_URL}/api/users/${id}`);
    return response.data;
  },
  
  // Add this to the userService or authService section
  updateUserPassword: async (userId: string, newPassword: string) => {
    const response = await axios.put(`${API_URL}/api/auth/users/password`, { 
      userId, 
      newPassword 
    });
    return response.data;
  }
};

// Export all services
export {
  authService,
  matrixService,
  userService,
  historyService
};
