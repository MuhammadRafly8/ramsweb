"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../components/auth/authContext';
import { toast } from 'react-toastify';
import { matrixService, historyService } from '../../../../services/api';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Link from 'next/link';


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ColumnAverage {
  id: number;
  name: string;
  average: number;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  matrixSnapshot: string;
  userId: string;
  user?: {
    username: string;
  };
}

export default function MatrixAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [columnAverages, setColumnAverages] = useState<ColumnAverage[]>([]);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [matrixTitle, setMatrixTitle] = useState('');
  const { isAuthenticated, isLoading } = useAuth();
  const params = useParams();
  const matrixId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch matrix details to get the title
        const matrixDetails = await matrixService.getMatrixById(matrixId);
        setMatrixTitle(matrixDetails.title || 'Matrix Analytics');
        
        // Fetch column averages
        const averagesData = await matrixService.getMatrixColumnAverages(matrixId);
        setColumnAverages(averagesData.averages || []);
        
        // Fetch history data - only user submissions
        const history = await historyService.getHistoryByMatrixId(matrixId);
        // Filter only user submissions with snapshots
        const userSubmissions = history.filter(
          (entry: HistoryEntry) => 
            entry.matrixSnapshot && 
            entry.action === 'submit_matrix' && 
            entry.user?.username !== 'admin'
        );
        setHistoryData(userSubmissions);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && !isLoading) {
      fetchData();
    }
  }, [matrixId, isAuthenticated, isLoading]);

  // Process history data to create timeline chart
  const processHistoryData = () => {
    if (!historyData.length) return null;
    
    // Sort history by timestamp
    const sortedHistory = [...historyData].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Extract data for each submission
    const datasets = columnAverages.map(column => {
      const dataPoints = sortedHistory.map(entry => {
        try {
          const snapshot = JSON.parse(entry.matrixSnapshot);
          let matrixData;
          
          // Handle different matrix data structures
          if (snapshot.data && snapshot.data.dependencies) {
            matrixData = snapshot.data;
          } else if (snapshot.dependencies) {
            matrixData = snapshot;
          } else {
            return 0;
          }
          
          // Count dependencies for this column
          let count = 0;
          Object.entries(matrixData.dependencies).forEach(([key, value]) => {
            if (value) {
              const [rowId, colId] = key.split('_').map(Number);
              if (colId === column.id) {
                count++;
              }
            }
          });
          
          return count;
        } catch (error) {
          console.error('Error processing snapshot:', error);
          return 0;
        }
      });
      
      return {
        label: `${column.name}`,
        data: dataPoints,
        borderColor: `hsl(${column.id * 30 % 360}, 70%, 50%)`,
        backgroundColor: `hsla(${column.id * 30 % 360}, 70%, 50%, 0.2)`,
        tension: 0.1
      };
    });
    
    return {
      labels: sortedHistory.map(entry => {
        const date = new Date(entry.timestamp);
        return date.toLocaleDateString();
      }),
      datasets
    };
  };


  const barChartData = {
    labels: columnAverages.map(col => col.name),
    datasets: [
      {
        label: 'Average Dependencies',
        data: columnAverages.map(col => col.average),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Timeline chart data
  const timelineData = processHistoryData();


  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Column Averages',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Dependencies',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Columns',
        },
      },
    },
  };

  const timelineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Dependency Trends',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Dependencies',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Submission Date',
        },
      },
    },
  };

  if (isLoading || loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <div className="p-8 text-center text-red-500">Please log in to view this page</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{matrixTitle}</h1>
          <Link 
            href={`/matrix/${matrixId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Matrix
          </Link>
        </div>

        {columnAverages.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No analytics data available for this matrix
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="h-[50vh]">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

            {timelineData && historyData.length > 1 && (
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="h-[50vh]">
                  <Line data={timelineData} options={timelineChartOptions} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}