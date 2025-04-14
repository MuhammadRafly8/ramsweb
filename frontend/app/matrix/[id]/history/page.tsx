"use client";

import { useEffect, useState, Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../components/auth/authContext';
import HistoryTable from '../../../../components/history/historyTable';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { StructuredMatrix } from '../../../../types/matrix';
import MatrixSnapshotViewer from '../../../../components/matrix/matrixSnapshotViewer';

export default function MatrixHistoryPage() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const matrixId = params.id as string;
  
  // Add state variables inside the component
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [selectedMatrix, setSelectedMatrix] = useState<StructuredMatrix | null>(null);

  // Add the viewMatrix function inside the component
  const viewMatrix = (matrixSnapshot: string) => {
    try {
      console.log("Parsing matrix snapshot...");
      const parsedData = JSON.parse(matrixSnapshot);
      
      // Handle different matrix data structures
      let matrix;
      
      // Check if the matrix has a data property (new format)
      if (parsedData.data && parsedData.data.rows && parsedData.data.columns && parsedData.data.dependencies) {
        // Extract the structured data from the nested format
        matrix = {
          rows: parsedData.data.rows,
          columns: parsedData.data.columns,
          dependencies: parsedData.data.dependencies
        };
      } 
      // Check if matrix has direct properties (old format)
      else if (parsedData.rows && parsedData.columns && parsedData.dependencies) {
        matrix = parsedData;
      }
      // If neither format is valid
      else {
        console.error("Matrix data is missing required properties:", parsedData);
        toast.error("Invalid matrix data format");
        return;
      }
      
      setSelectedMatrix(matrix);
      setShowMatrixModal(true);
    } catch (error) {
      console.error("Error parsing matrix snapshot:", error);
      toast.error("Failed to parse matrix data");
    }
  };

  // Add the closeMatrixModal function inside the component
  const closeMatrixModal = () => {
    setShowMatrixModal(false);
    setSelectedMatrix(null);
  };

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || !isAdmin())) {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  // Don't render anything until authentication check is complete
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // Don't render content if not authenticated or not admin
  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

  // Replace the existing matrix modal with the shared component
  return (
    <main className="flex-grow container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Matrix History</h2>
          <Link href={`/matrix/${matrixId}`} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
            Back to Matrix
          </Link>
        </div>
        <div className="mb-4">
          <p className="text-gray-600">
            This page shows the history of all changes made to this specific matrix.
            Each entry includes the user who made the change and the action taken.
          </p>
        </div>
        <HistoryTable matrixId={matrixId} viewMatrix={viewMatrix} />
      </div>
      
      {/* Matrix Modal using the shared component */}
      {showMatrixModal && selectedMatrix && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-[98vw] h-[98vh]">
            <MatrixSnapshotViewer 
              matrix={selectedMatrix} 
              onClose={closeMatrixModal} 
            />
          </div>
        </div>
      )}
    </main>
  );
}