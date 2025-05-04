import axios from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface HistoryEntry {
  id: string;
  userId: string;
  matrixId: string;
  action: string;
  details?: string;
  timestamp: string;
  matrixSnapshot?: string;
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

// Add this interface for matrix submissions
export interface MatrixSubmission {
  id: string;
  userId: string;
  username: string;
  matrixId: string;
  data: unknown; // You can replace 'any' with your StructuredMatrix type
  createdAt: string;
}

const historyService = {
  getAllHistory: async (): Promise<HistoryEntry[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  },
  
  getHistoryByMatrixId: async (matrixId: string): Promise<HistoryEntry[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/history/matrix/${matrixId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching matrix history:', error);
      throw error;
    }
  },
  
  createHistoryEntry: async (entry: Partial<HistoryEntry>): Promise<HistoryEntry> => {
    try {
      const response = await axios.post(`${API_URL}/api/history`, entry);
      return response.data;
    } catch (error) {
      console.error('Error creating history entry:', error);
      throw error;
    }
  },
  
  deleteHistoryEntry: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/api/history/${id}`);
    } catch (error) {
      console.error('Error deleting history entry:', error);
      throw error;
    }
  },
  
  // Update this method to use a more reliable approach
  getSubmissionsByMatrixId: async (matrixId: string): Promise<MatrixSubmission[]> => {
    try {
      // First try the dedicated endpoint
      try {
        const response = await axios.get(`${API_URL}/api/history/submissions/matrix/${matrixId}`);
        return response.data;
      } catch (submissionError) {
        console.warn('Dedicated submissions endpoint failed, falling back to history endpoint', submissionError);
        
        // Fallback: Get all history for this matrix and filter for submissions
        const historyResponse = await axios.get(`${API_URL}/api/history/matrix/${matrixId}`);
        const submissions = historyResponse.data
          .filter((entry: HistoryEntry) => 
            entry.action === 'submit_matrix' && entry.matrixSnapshot)
          .map((entry: HistoryEntry) => {
            // Parse the matrix snapshot
            let data;
            try {
              data = JSON.parse(entry.matrixSnapshot || '{}');
              // Handle different data structures
              if (data.data) {
                data = data.data;
              }
            } catch (e) {
              console.error('Error parsing matrix snapshot:', e);
              data = {};
            }
            
            return {
              id: entry.id,
              userId: entry.userId,
              username: entry.user?.username || 'Unknown',
              matrixId: entry.matrixId,
              data: data,
              createdAt: entry.timestamp
            };
          });
        
        return submissions;
      }
    } catch (error) {
      console.error('Error fetching submissions by matrix ID:', error);
      throw error;
    }
  }
};

export default historyService;