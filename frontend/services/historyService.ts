import axios from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface HistoryEntry {
  id?: string;
  userId: string;
  userRole: string;
  timestamp: string;
  action: string;
  matrixId: string;
  rowId?: number;
  columnId?: number;
  rowName?: string;
  columnName?: string;
  cellKey?: string;
  details?: string;
  matrixSnapshot?: string;
  adminOnly?: boolean;
  user?: {
    id: string;
    username: string;
  };
}

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
  createHistoryEntry: async (entry: HistoryEntry) => {
    const response = await axios.post(`${API_URL}/api/history`, entry);
    return response.data;
  },

  // Delete a history entry
  deleteHistoryEntry: async (id: string) => {
    const response = await axios.delete(`${API_URL}/api/history/${id}`);
    return response.data;
  }
};

export default historyService;