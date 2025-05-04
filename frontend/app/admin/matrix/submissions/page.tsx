"use client";

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import AdminRoute from '../../../../components/auth/adminRoute';
import { toast } from "react-toastify";
import { format } from "date-fns";
import historyService, { HistoryEntry } from "../../../../services/historyService";
import Link from 'next/link';
import React from 'react';
import MatrixSnapshotViewer from '../../../../components/matrix/matrixSnapshotViewer';
import MatrixNormalization from '../../../../components/matrix/matrixNormalization';
import { matrixService } from '../../../../services/api';

interface StructuredMatrix {
  rows: { id: number; name: string; category: string }[];
  columns: { id: number; name: string }[];
  dependencies: Record<string, boolean>;
}

interface MatrixSubmission {
  id: string;
  userId: string;
  username: string;
  matrixId: string;
  data: StructuredMatrix;
  createdAt: string;
}

export default function MatrixSubmissionsPage() {
  const [submissions, setSubmissions] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatrix, setSelectedMatrix] = useState<StructuredMatrix | null>(null);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showNormalizationModal, setShowNormalizationModal] = useState(false);
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
  const [matrixSubmissions, setMatrixSubmissions] = useState<MatrixSubmission[]>([]);
  const [groupedSubmissions, setGroupedSubmissions] = useState<Record<string, HistoryEntry[]>>({});
  const router = useRouter();

  // In your useEffect function for fetching submissions
  useEffect(() => {
    // Fetch all submissions from history
    const fetchSubmissions = async () => {
      try {
        console.log('Fetching submissions history...');
        // Get all history entries
        const data = await historyService.getAllHistory();
        console.log('History data received:', data);
        
        // Filter to only show submissions
        const submissionEntries = Array.isArray(data) 
          ? data.filter(entry => entry.action === 'submit_matrix')
          : [];
        
        console.log('Filtered submission entries:', submissionEntries.length);
        
        // Sort by timestamp (newest first)
        const sortedSubmissions = submissionEntries.sort((a: HistoryEntry, b: HistoryEntry) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setSubmissions(sortedSubmissions);
        
        // Group submissions by matrixId
        const grouped: Record<string, HistoryEntry[]> = {};
        sortedSubmissions.forEach(submission => {
          if (!grouped[submission.matrixId]) {
            grouped[submission.matrixId] = [];
          }
          grouped[submission.matrixId].push(submission);
        });
        
        setGroupedSubmissions(grouped);
      } catch (error) {
        console.error("Error loading submissions:", error);
        toast.error("Failed to load submission data");
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSubmissions();
  }, []);

  const viewMatrix = (matrixSnapshot: string) => {
    try {
      console.log("Attempting to parse matrix snapshot...");
      
      // Parse the JSON data
      const parsedData = JSON.parse(matrixSnapshot);
      console.log("Successfully parsed JSON data:", Object.keys(parsedData));
      
      // Handle different matrix data structures
      let matrix: StructuredMatrix;
      
      // Check if the matrix has a data property (new format)
      if (parsedData.data) {
        console.log("Found data property with keys:", Object.keys(parsedData.data));
        
        // Check if data contains the required properties
        if (Array.isArray(parsedData.data.rows) && 
            Array.isArray(parsedData.data.columns) && 
            typeof parsedData.data.dependencies === 'object') {
          matrix = {
            rows: [...parsedData.data.rows],
            columns: [...parsedData.data.columns],
            dependencies: {...parsedData.data.dependencies}
          };
          console.log("Using nested data format with", matrix.rows.length, "rows and", matrix.columns.length, "columns");
        } else {
          console.error("Invalid nested data structure:", 
            "rows:", Array.isArray(parsedData.data.rows), 
            "columns:", Array.isArray(parsedData.data.columns),
            "dependencies:", typeof parsedData.data.dependencies);
          toast.error("Invalid matrix data structure");
          return;
        }
      }
      // Check if matrix has direct properties (old format)
      else if (Array.isArray(parsedData.rows) && 
               Array.isArray(parsedData.columns) && 
               typeof parsedData.dependencies === 'object') {
        matrix = {
          rows: [...parsedData.rows],
          columns: [...parsedData.columns],
          dependencies: {...parsedData.dependencies}
        };
        console.log("Using direct data format with", matrix.rows.length, "rows and", matrix.columns.length, "columns");
      } else {
        console.error("Matrix data is missing required properties:", Object.keys(parsedData));
        toast.error("Invalid matrix data format");
        return;
      }
      
      // Additional validation to ensure we have valid data
      if (!matrix.rows.length || !matrix.columns.length) {
        console.error("Matrix has empty rows or columns");
        toast.error("Matrix data is incomplete");
        return;
      }
      
      // Set the selected matrix and show the modal
      setSelectedMatrix(matrix);
      setShowMatrixModal(true);
      console.log("Matrix loaded successfully with", matrix.rows.length, "rows");
    } catch (error) {
      console.error("Error parsing matrix snapshot:", error);
      toast.error("Failed to load matrix data. The format might be invalid.");
    }
  };

  const closeMatrixModal = () => {
    setShowMatrixModal(false);
    setSelectedMatrix(null);
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!id) {
      toast.error("Cannot delete submission without ID");
      return;
    }
    
    if (confirm("Are you sure you want to delete this submission?")) {
      try {
        await historyService.deleteHistoryEntry(id);
        
        // Update state by removing the deleted entry
        setSubmissions(submissions.filter(entry => entry.id !== id));
        
        toast.success("Submission deleted successfully");
      } catch (error) {
        console.error("Error deleting submission:", error);
        toast.error("Failed to delete submission");
      }
    }
  };

  const viewMatrixDetails = (matrixId: string) => {
    router.push(`/matrix/${matrixId}`);
  };
  
  // New function to open normalization modal
  const openNormalizationModal = async (matrixId: string) => {
    try {
      setSelectedMatrixId(matrixId);
      
      // Fetch matrix details
      const matrixDetails = await matrixService.getMatrixById(matrixId);
      setSelectedMatrix(matrixDetails.data);
      
      // Fetch submissions for this matrix
      const submissions = await historyService.getSubmissionsByMatrixId(matrixId);
      setMatrixSubmissions(submissions as MatrixSubmission[]);
      
      // Show normalization modal
      setShowNormalizationModal(true);
    } catch (error) {
      console.error("Error fetching data for normalization:", error);
      toast.error("Failed to load data for normalization");
    }
  };
  
  // Function to close normalization modal
  const closeNormalizationModal = () => {
    setShowNormalizationModal(false);
    setSelectedMatrix(null);
    setSelectedMatrixId(null);
  };

  return (
    <AdminRoute>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Matrix Submissions</h1>
          <Link href="/admin/matrix" className="text-blue-600 hover:underline">
            Back to Matrices
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Loading submissions...</p>
          </div>
        ) : (
          <>
            {/* Matrix Grouping Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Submissions by Matrix</h2>
              
              {Object.keys(groupedSubmissions).length === 0 ? (
                <p className="text-gray-500">No submissions found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(groupedSubmissions).map(([matrixId, entries]) => (
                    <div key={matrixId} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Matrix ID: {matrixId.substring(0, 8)}...</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {entries.length} submissions
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Last submission: {format(new Date(entries[0].timestamp), 'MMM d, yyyy HH:mm')}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewMatrixDetails(matrixId)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded"
                        >
                          View Matrix
                        </button>
                        <button
                          onClick={() => openNormalizationModal(matrixId)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded"
                        >
                          Normalize Data
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-semibold mb-4">All Submissions</h2>
            
            {submissions.length === 0 ? (
              <p className="text-gray-500">No submissions found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 border-b text-left">Time</th>
                      <th className="py-2 px-4 border-b text-left">User</th>
                      <th className="py-2 px-4 border-b text-left">Role</th>
                      <th className="py-2 px-4 border-b text-left">Matrix ID</th>
                      <th className="py-2 px-4 border-b text-left">Details</th>
                      <th className="py-2 px-4 border-b text-center">View Matrix</th>
                      <th className="py-2 px-4 border-b text-center">View History</th>
                      <th className="py-2 px-4 border-b text-center">View Snapshot</th>
                      <th className="py-2 px-4 border-b text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">
                          {format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {entry.user?.username || 'Unknown'}
                        </td>
                        <td className="py-2 px-4 border-b">
                          <span className={`inline-block px-2 py-1 text-xs rounded ${
                            entry.user?.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {entry.user?.role || 'user'}
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b">
                          {entry.matrixId}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {entry.details || 'User submitted matrix'}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          <button
                            onClick={() => viewMatrixDetails(entry.matrixId)}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
                          >
                            View Matrix
                          </button>
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          <Link 
                            href={`/matrix/${entry.matrixId}/history`}
                            className="bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded text-sm inline-block"
                          >
                            History
                          </Link>
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          <button
                            onClick={() => entry.matrixSnapshot && viewMatrix(entry.matrixSnapshot)}
                            disabled={!entry.matrixSnapshot}
                            className={`py-1 px-3 rounded text-sm ${
                              entry.matrixSnapshot 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            View Snapshot
                          </button>
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          <button
                            onClick={() => handleDeleteSubmission(entry.id)}
                            className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        
        {/* Matrix Snapshot Viewer Modal */}
        {showMatrixModal && selectedMatrix && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Matrix Snapshot</h3>
                  <button 
                    onClick={closeMatrixModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
                <MatrixSnapshotViewer matrix={selectedMatrix} />
              </div>
            </div>
          </div>
        )}
        
        {/* Matrix Normalization Modal */}
        {showNormalizationModal && selectedMatrix && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto">
              <MatrixNormalization 
                matrix={selectedMatrix} 
                submissions={matrixSubmissions}
                onClose={closeNormalizationModal} 
              />
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}
