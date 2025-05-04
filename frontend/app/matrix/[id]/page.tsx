"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { MatrixItem, StructuredMatrix } from "../../../types/matrix";
import { useAuth } from "../../../components/auth/authContext";
import { matrixService, historyService } from "../../../services/api";
import Link from 'next/link';
import ShareMatrix from "../../../components/matrix/shareMatrix";
import MatrixNormalization from "../../../components/matrix/matrixNormalization";

export default function MatrixDetailPage() {
  // Existing state variables
  const [matrix, setMatrix] = useState<MatrixItem | null>(null);
  const [loading, setLoading] = useState(true);
  // Add these missing state variables
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [selectedMatrix, setSelectedMatrix] = useState<StructuredMatrix | null>(null);
  
  // Make sure closeMatrixModal is properly defined
  const closeMatrixModal = () => {
    setShowMatrixModal(false);
    setSelectedMatrix(null);
  };
  
  const [rowTotals, setRowTotals] = useState<Record<number, number>>({});
  const [, setColumnTotals] = useState<Record<number, number>>({});
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [showKeywordModal, setShowKeywordModal] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [keywordError, setKeywordError] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Add these state variables
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionComment, setSubmissionComment] = useState("");
  
  // Add state for normalization modal
  const [showNormalizationModal, setShowNormalizationModal] = useState(false);
  
  const params = useParams();
  const matrixId = params.id as string;
  const { isAuthenticated, userId, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Load matrix from API instead of localStorage
    const fetchMatrix = async () => {
      try {
        const data = await matrixService.getMatrixById(matrixId);
        setMatrix(data);
        calculateTotals(data.data);
        
        // Check if user is admin or already authorized via backend
        if (isAdmin() || data.createdBy === userId || data.authorized === true) {
          setIsAuthorized(true);
          setShowKeywordModal(false);
        }
      } catch (error) {
        console.error("Error fetching matrix:", error);
        toast.error("Failed to load matrix");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchMatrix();
    }
  }, [matrixId, isAdmin, userId, isAuthenticated]);

  const handleCellChange = async (rowId: number, colId: number) => {
    if (!matrix || !isAuthenticated || !isAuthorized) return;
    
    const key = `${rowId}_${colId}`;
    const newValue = !matrix.data.dependencies[key];
    
    try {
      // Create a copy of the matrix to update
      const updatedMatrix = {
        ...matrix,
        data: {
          ...matrix.data,
          dependencies: {
            ...matrix.data.dependencies,
            [key]: newValue
          }
        }
      };
      
      // Update local state for better UX
      setMatrix(updatedMatrix);
      calculateTotals(updatedMatrix.data);
      
      // Send only the necessary data to the backend
      const updatePayload = {
        title: matrix.title,
        description: matrix.description,
        keyword: matrix.keyword,
        data: updatedMatrix.data
      };
      
      // Save changes to API
      await matrixService.updateMatrix(matrixId, updatePayload);
      
      // We're removing the history entry creation for regular cell changes
      // This way only submissions will appear in history
      
      toast.success(newValue ? "Dependency added" : "Dependency removed");
    } catch (error) {
      console.error("Error updating matrix:", error);
      toast.error("Failed to update matrix");
      
      // If there's an error, revert to the original matrix
      if (matrix) {
        setMatrix({...matrix});
        calculateTotals(matrix.data);
      }
    }
  };

  const calculateTotals = (data: StructuredMatrix) => {
    const rowTotals: Record<number, number> = {};
    const columnTotals: Record<number, number> = {};
    const categoryTotals: Record<string, number> = {};

    // Initialize totals
    data.rows.forEach(row => {
      rowTotals[row.id] = 0;
      if (!categoryTotals[row.category]) {
        categoryTotals[row.category] = 0;
      }
    });
    
    data.columns.forEach(col => {
      columnTotals[col.id] = 0;
    });

    // Calculate totals
    Object.entries(data.dependencies).forEach(([key, value]) => {
      if (value) {
        const [rowId, colId] = key.split('_').map(Number);
        rowTotals[rowId] = (rowTotals[rowId] || 0) + 1;
        columnTotals[colId] = (columnTotals[colId] || 0) + 1;
        
        // Find the category for this row
        const row = data.rows.find(r => r.id === rowId);
        if (row) {
          categoryTotals[row.category] = (categoryTotals[row.category] || 0) + 1;
        }
      }
    });

    setRowTotals(rowTotals);
    setColumnTotals(columnTotals);
    setCategoryTotals(categoryTotals);
  };

  const verifyKeyword = async () => {
    if (!matrix) return;
    
    setKeywordError("");
    
    if (!keyword.trim()) {
      setKeywordError("Keyword is required");
      return;
    }
    
    try {
      // Verify keyword through backend API
      const response = await matrixService.verifyMatrixAccess(matrixId, keyword);
      
      if (response.authorized) {
        setIsAuthorized(true);
        setShowKeywordModal(false);
        toast.success("Access granted!");
      } else {
        setKeywordError("Invalid keyword. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying keyword:", error);
      setKeywordError("Failed to verify keyword. Please try again.");
    }
  };

  
  const handleSubmitMatrix = async () => {
    if (!matrix || !isAuthenticated || !isAuthorized) return;
    
    try {
      // Create a complete matrix snapshot with the correct structure
      // Make sure we include all necessary fields and maintain the exact structure
      const matrixData = {
        id: matrix.id,
        title: matrix.title,
        description: matrix.description,
        keyword: matrix.keyword,
        createdBy: matrix.createdBy,
        createdAt: matrix.createdAt,
        updatedAt: new Date().toISOString(),
        data: {
          rows: matrix.data.rows,
          columns: matrix.data.columns,
          dependencies: matrix.data.dependencies
        }
      };
      
      // Create a snapshot of the current matrix state with all dependencies
      const matrixSnapshot = JSON.stringify(matrixData);
      
      // Calculate totals for the submission record
      const rowTotalValues = Object.values(rowTotals);
      const totalDependencies = rowTotalValues.reduce((sum, val) => sum + val, 0);
      
      // Create a more detailed history entry
      const historyEntry = {
        userId: userId || 'unknown',
        userRole: isAdmin() ? 'admin' : 'user',
        timestamp: new Date().toISOString(),
        action: 'submit_matrix',
        matrixId: matrixId,
        details: submissionComment 
          ? `User submitted matrix "${matrix.title}" with comment: ${submissionComment}`
          : `User submitted matrix "${matrix.title}" with ${totalDependencies} dependencies`,
        matrixSnapshot: matrixSnapshot,
        matrixTitle: matrix.title,
        matrixDescription: matrix.description,
        adminOnly: true // Make sure this is only visible to admins
      };
      
      // Save to API
      await historyService.createHistoryEntry(historyEntry);
      
      // Show success message
      toast.success("Matrix submitted successfully");
      
      // Close modal
      setShowSubmitModal(false);
      setSubmissionComment("");
      
      // If admin, redirect to history page for this matrix
      if (isAdmin()) {
        router.push(`/matrix/${matrixId}/history`);
      }
    } catch (error) {
      console.error("Error submitting matrix:", error);
      toast.error("Failed to submit matrix");
    }
  };
  
  // Add this function to calculate group totals for Sub Total row
  const calculateGroupTotal = (start: number, end: number, columnTotals: Record<number, number>) => {
    let total = 0;
    for (let i = start; i <= end; i++) {
      total += columnTotals[i] || 0;
    }
    return total;
  };
  
  if (loading) {
    return (
      <div className="flex-grow container mx-auto p-4 text-center">
        Loading matrix data...
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="flex-grow container mx-auto p-4 text-center">
        Matrix not found
      </div>
    );
  }

  // Group rows by category
  const rowsByCategory = matrix.data.rows.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = [];
    }
    acc[row.category].push(row);
    return acc;
  }, {} as Record<string, typeof matrix.data.rows>);

  // Calculate column totals for the Relation From row
  const calculateColumnTotals = () => {
    const columnTotals: Record<number, number> = {};
    
    matrix.data.columns.forEach(column => {
      columnTotals[column.id] = matrix.data.rows.reduce((total, row) => {
        const key = `${row.id}_${column.id}`;
        return total + (matrix.data.dependencies[key] ? 1 : 0);
      }, 0);
    });
    
    return columnTotals;
  };
  
  const columnTotalsData = calculateColumnTotals();

  return (
    <main className="flex-grow container mx-auto p-4">
      {showKeywordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Enter Access Keyword</h3>
            <p className="mb-4 text-gray-600">
              This matrix is protected. Please enter the access keyword to continue.
            </p>
            
            {keywordError && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {keywordError}
              </div>
            )}
            
            <div className="mb-4">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter keyword"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={verifyKeyword}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Matrix Modal */}
      {showMatrixModal && selectedMatrix && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-[98vw] h-[98vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold">
                Matrix Snapshot 
                <span className="text-sm ml-2 text-gray-600">
                  ({selectedMatrix.rows.length} sub-attributes × {selectedMatrix.columns.length} columns)
                </span>
              </h3>
              <button 
                onClick={closeMatrixModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="mb-2 text-xs text-gray-600">
              <p>This is a snapshot of the matrix at the time of submission.</p>
            </div>
            
            <div className="overflow-auto flex-grow">
              <div className="min-w-max">
                <table className="min-w-full border-collapse border border-gray-300">
                  
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-1 text-center">ID</th>
                      <th className="border border-gray-300 p-1 text-center">Sub-Attribute</th>
                      <th className="border border-gray-300 p-1 text-left">Category</th>
                      <th className="border border-gray-300 p-1 text-center">Relation To</th>
                      {selectedMatrix.columns.map((column) => (
                        <th 
                          key={column.id} 
                          className={`border border-gray-300 p-1 text-center ${
                            column.id % 5 === 0 ? 'border-r-2 border-r-gray-500' : ''
                          }`}
                        >
                          {column.id}
                        </th>
                      ))}
                      <th className="border border-gray-300 p-1 text-center">Total</th>
                      <th className="border border-gray-300 p-1 text-center">Category Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      try {
                        // Group rows by category
                        const rowsByCategory = selectedMatrix.rows.reduce((acc, row) => {
                          const category = row.category || 'Uncategorized';
                          if (!acc[category]) {
                            acc[category] = [];
                          }
                          acc[category].push(row);
                          return acc;
                        }, {} as Record<string, typeof selectedMatrix.rows>);
                        
                        // Calculate row totals
                        const rowTotals: Record<number, number> = {};
                        selectedMatrix.rows.forEach(row => {
                          rowTotals[row.id] = 0;
                        });
                        
                        Object.entries(selectedMatrix.dependencies).forEach(([key, value]) => {
                          if (value) {
                            const [rowId] = key.split('_').map(Number);
                            rowTotals[rowId] = (rowTotals[rowId] || 0) + 1;
                          }
                        });
                        
                        // Calculate category totals
                        const categoryTotals: Record<string, number> = {};
                        Object.entries(rowsByCategory).forEach(([category, rows]) => {
                          categoryTotals[category] = rows.reduce((sum, row) => sum + (rowTotals[row.id] || 0), 0);
                        });
                        
                        // Calculate subtotals for each row
                        const calculateSubtotals = (rowId: number) => {
                          let count = 0;
                          selectedMatrix.columns.forEach(column => {
                            const key = `${rowId}_${column.id}`;
                            if (selectedMatrix.dependencies[key] && column.id < rowId) {
                              count++;
                            }
                          });
                          return count;
                        };
                        
                        return Object.entries(rowsByCategory).map(([category, rows]) => (
                          <Fragment key={category}>
                            {rows.map((row, rowIndex) => (
                              <tr key={row.id} className={row.id % 5 === 0 ? 'border-b-2 border-b-gray-500' : ''}>
                                <td className="border border-gray-300 p-1 text-center">{row.id}</td>
                                <td className="border border-gray-300 p-1 text-left">
                                  {row.name}
                                </td>
                                {rowIndex === 0 ? (
                                  <td 
                                    className="border border-gray-300 p-1 text-center font-bold" 
                                    rowSpan={rows.length}
                                  >
                                    {category}
                                  </td>
                                ) : null}
                                <td className="border border-gray-300 p-1 text-center">
                                  {calculateSubtotals(row.id)}
                                </td>
                                {selectedMatrix.columns.map((column) => {
                                  const key = `${row.id}_${column.id}`;
                                  const value = Boolean(selectedMatrix.dependencies[key]);
                                  const isDisabled = row.id === column.id || row.id > column.id;
                                  const isGreen = row.id > column.id;
                                  
                                  // Add a visual separator at the diagonal
                                  const isDiagonal = row.id === column.id;
                                  const isNearDiagonal = Math.abs(row.id - column.id) <= 1;
                                  
                                  return (
                                    <td 
                                      key={key} 
                                      className={`border border-gray-300 p-0 text-center ${
                                        isDisabled ? (isGreen ? 'bg-green-800' : 'bg-gray-200') : (value ? 'bg-green-800' : 'bg-white')
                                      } ${
                                        isDiagonal ? 'border-2 border-red-500' : ''
                                      } ${
                                        isNearDiagonal ? 'border-r border-r-red-300' : ''
                                      } ${
                                        column.id % 5 === 0 ? 'border-r-2 border-r-gray-500' : ''
                                      }`}
                                      style={{ width: '20px', height: '20px', maxWidth: '30px' }}
                                    >
                                      {value && !isDisabled ? <span className="text-white">x</span> : ''}
                                    </td>
                                  );
                                })}
                                <td className="border border-gray-300 p-1 text-center font-bold">
                                  {rowTotals[row.id] || 0}
                                </td>
                                {rowIndex === 0 ? (
                                  <td 
                                    className="border border-gray-300 p-1 text-center font-bold" 
                                    rowSpan={rows.length}
                                  >
                                    {categoryTotals[category] || 0}
                                  </td>
                                ) : null}
                              </tr>
                            ))}
                          </Fragment>
                        ));
                      } catch (error) {
                        console.error("Error rendering matrix:", error);
                        return (
                          <tr>
                            <td colSpan={5 + selectedMatrix.columns.length} className="text-center text-red-500 p-4">
                              Error rendering matrix. Please check console for details.
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Submit Modal here */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Submit Matrix</h3>
            <p className="mb-4">
              Are you sure you want to submit this matrix? This will create a record for admin review.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments (optional)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded p-2"
                rows={3}
                value={submissionComment}
                onChange={(e) => setSubmissionComment(e.target.value)}
                placeholder="Add any comments about your submission..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMatrix}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Normalization Modal */}
      {showNormalizationModal && matrix && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 w-[98vw] h-[98vh] overflow-auto">
            <MatrixNormalization 
              matrix={matrix.data} 
              onClose={() => setShowNormalizationModal(false)} 
            />
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{matrix?.title}</h2>
          <div className="flex space-x-2">
            {!isAdmin() && (
              <>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!isAuthorized}
                >
                  Submit Matrix
                </button>
                <button
                  onClick={() => setShowNormalizationModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  disabled={!isAuthorized}
                >
                  Calculate Normalization
                </button>
              </>
            )}
            {isAdmin() && (
              <>
                <ShareMatrix 
                  matrixId={matrixId} 
                  buttonText="Bagikan" 
                  className="bg-green-600 hover:bg-green-700" 
                />
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!isAuthorized}
                >
                  Submit Matrix
                </button>
                <Link 
                  href={`/admin/matrix/submissions`}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  All Submissions
                </Link>
                <Link 
                  href={`/matrix/${matrixId}/analytics`}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                  View Analytics
                </Link>
                <button
                  onClick={() => setShowNormalizationModal(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                  Calculate Normalization
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1 text-center">ID</th>
                <th className="border border-gray-300 p-1 text-center">Sub-Attribute</th>
                <th className="border border-gray-300 p-1 text-left">Category</th>
                {matrix.data.columns.map((column) => (
                  <th key={column.id} className="border border-gray-300 p-1 text-center">
                    {column.id}
                  </th>
                ))}
                <th className="border border-gray-300 p-1 text-center">Total</th>
                <th className="border border-gray-300 p-1 text-center">Category Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Main table rows remain unchanged */}
              {Object.entries(rowsByCategory).map(([category, rows]) => (
                <Fragment key={category}>
                  {rows.map((row, rowIndex) => (
                    <tr key={row.id}>
                      <td className="border border-gray-300 p-1 text-center text-xs md:text-sm">{row.id}</td>
                      <td className="border border-gray-300 p-1 text-left text-xs md:text-sm">
                        {row.name}
                      </td>
                      {rowIndex === 0 ? (
                        <td 
                          className="border border-gray-300 p-1 text-center font-bold text-xs md:text-sm" 
                          rowSpan={rows.length}
                        >
                          {category}
                        </td>
                      ) : null}
                      {matrix.data.columns.map((column) => {
                        const key = `${row.id}_${column.id}`;
                        const value = matrix.data.dependencies[key] || false;
                        const isDisabled = row.id === column.id || row.id > column.id;
                        const isGreen = row.id > column.id;
                        
                        return (
                          <td 
                            key={key} 
                            className={`border border-gray-300 p-0 text-center ${
                              isDisabled ? (isGreen ? 'bg-green-800' : 'bg-gray-200') : (value ? 'bg-green-800' : 'bg-white')
                            }`}
                            onClick={() => isAuthorized && !isDisabled && handleCellChange(row.id, column.id)}
                            style={{ cursor: isAuthorized && !isDisabled ? 'pointer' : 'not-allowed', width: '20px', height: '20px', maxWidth: '30px' }}
                          >
                            {value && !isDisabled ? <span className="text-white">x</span> : ''}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 p-1 text-center font-bold text-xs md:text-sm">
                        {rowTotals[row.id] || 0}
                      </td>
                      {rowIndex === 0 ? (
                        <td 
                          className="border border-gray-300 p-1 text-center font-bold text-xs md:text-sm" 
                          rowSpan={rows.length}
                        >
                          {categoryTotals[category] || 0}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </Fragment>
              ))}
              
              {/* Add Relation From row */}
              <tr className="bg-gray-100">
                <td colSpan={3} className="border border-gray-300 p-1 text-right font-bold text-xs md:text-sm">
                  Relation From
                </td>
                {matrix.data.columns.map((column) => (
                  <td key={`relation-from-${column.id}`} className="border border-gray-300 p-1 text-center font-bold text-xs md:text-sm">
                    {columnTotalsData[column.id] || 0}
                  </td>
                ))}
                <td className="border border-gray-300 p-1"></td>
                <td className="border border-gray-300 p-1"></td>
              </tr>
              
              {/* Add Sub Total row */}
              <tr className="bg-gray-100">
                <td colSpan={3} className="border border-gray-300 p-1 text-right font-bold text-xs md:text-sm">
                  Sub Total
                </td>
                {(() => {
                  // Get unique categories in order they appear
                  const categories = Object.keys(rowsByCategory);
                  
                  // Create a map of column IDs to their categories
                  const columnCategories: Record<number, string> = {};
                  matrix.data.rows.forEach(row => {
                    columnCategories[row.id] = row.category;
                  });
                  
                  // Group columns by category
                  const columnsByCategory: Record<string, number[]> = {};
                  categories.forEach(category => {
                    columnsByCategory[category] = [];
                  });
                  
                  matrix.data.columns.forEach(column => {
                    const category = columnCategories[column.id];
                    if (category && columnsByCategory[category]) {
                      columnsByCategory[category].push(column.id);
                    }
                  });
                  
                  // Calculate subtotals for each category
                  return categories.map(category => {
                    const columns = columnsByCategory[category] || [];
                    if (columns.length === 0) return null;
                    
                    // Calculate total dependencies for this category's columns
                    const total = columns.reduce((sum, colId) => {
                      return sum + (columnTotalsData[colId] || 0);
                    }, 0);
                    
                    return (
                      <td 
                        key={`subtotal-${category}`}
                        colSpan={columns.length}
                        className="border border-gray-300 p-1 text-center font-bold text-xs md:text-sm"
                      >
                        {total}
                      </td>
                    );
                  });
                })()}
                <td className="border border-gray-300 p-1"></td>
                <td className="border border-gray-300 p-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
