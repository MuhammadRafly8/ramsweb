import { Fragment, useState, useEffect } from 'react';
import { StructuredMatrix } from '../../types/matrix';
import { useAuth } from '../auth/authContext';

interface MatrixSubmission {
  id: string;
  userId: string;
  username: string;
  matrixId: string;
  data: StructuredMatrix;
  createdAt: string;
}

interface MatrixNormalizationProps {
  matrix: StructuredMatrix;
  submissions?: MatrixSubmission[]; // Add submissions prop
  onClose?: () => void;
  minSubmissionsRequired?: number; // Add minimum submissions required
}

export default function MatrixNormalization({ 
  matrix, 
  submissions = [], 
  onClose,
  minSubmissionsRequired = 3 // Default minimum submissions required
}: MatrixNormalizationProps) {
  const { isAdmin } = useAuth();
  const [normalizedData, setNormalizedData] = useState<Record<string, number>>({});
  const [categoryWeights, setCategoryWeights] = useState<Record<string, number>>({});
  const [categorySubtotals, setCategorySubtotals] = useState<Record<string, number>>({});
  const [comparisonValues, setComparisonValues] = useState<Record<string, number>>({});
  const [minValue, setMinValue] = useState(1);
  const [maxValue, setMaxValue] = useState(9);
  const [newMinValue, setNewMinValue] = useState(1);
  const [newMaxValue, setNewMaxValue] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subAttributeWeights, setSubAttributeWeights] = useState<Record<number, number>>({});
  const [subAttributeNormalized, setSubAttributeNormalized] = useState<Record<number, number>>({});
  const [subAttributeComparisons, setSubAttributeComparisons] = useState<Record<string, Record<string, number>>>({});
  const [aggregatedDependencies, setAggregatedDependencies] = useState<Record<string, number>>({});
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [isNormalizationEnabled, setIsNormalizationEnabled] = useState<boolean>(false);

  // Debug logging for received props
  useEffect(() => {
    console.log("MatrixNormalization received props:", {
      matrix: matrix,
      submissionsCount: submissions.length,
      submissions: submissions
    });
  }, [matrix, submissions]);
  
  // Aggregate dependencies from all submissions
  useEffect(() => {
    console.log("Processing submissions:", submissions.length);
    
    if (submissions.length === 0) {
      console.log("No submissions provided, using current matrix");
      setAggregatedDependencies(
        Object.entries(matrix.dependencies).reduce((acc, [key, value]) => {
          acc[key] = value ? 1 : 0;
          return acc;
        }, {} as Record<string, number>)
      );
      setSubmissionCount(1);
      return;
    }
    
    // Combine dependencies from all submissions
    const combined: Record<string, number> = {};
    
    // Initialize all possible keys with 0
    matrix.rows.forEach(row => {
      matrix.columns.forEach(column => {
        const key = `${row.id}_${column.id}`;
        combined[key] = 0;
      });
    });
    
    // Sum up dependencies across all submissions
    let validSubmissions = 0;
    submissions.forEach(submission => {
      if (submission && submission.data && submission.data.dependencies) {
        validSubmissions++;
        Object.entries(submission.data.dependencies).forEach(([key, value]) => {
          if (value) {
            combined[key] = (combined[key] || 0) + 1;
          }
        });
      } else {
        console.warn("Invalid submission found:", submission);
      }
    });
    
    console.log("Valid submissions processed:", validSubmissions);
    console.log("Combined dependencies:", combined);
    
    setAggregatedDependencies(combined);
    setSubmissionCount(validSubmissions);
    
    // Always enable normalization regardless of submission count
    setIsNormalizationEnabled(true);
  }, [matrix, submissions]);

  // Add state for data statistics
  const [dataStats, setDataStats] = useState({
    totalRelationships: 0,
    filledRelationships: 0,
    percentageFilled: 0,
    maxPossibleRelationships: 0,
    submissionProgress: 0
  });

  // Calculate data statistics
  useEffect(() => {
    // Calculate total possible relationships (rows × columns)
    const maxPossibleRelationships = matrix.rows.length * matrix.columns.length;
    
    // Calculate filled relationships (at least by one user)
    const filledRelationships = Object.values(aggregatedDependencies).filter(count => count > 0).length;
    
    // Calculate total relationships (sum of all relationships)
    const totalRelationships = Object.values(aggregatedDependencies).reduce((sum, count) => sum + count, 0);
    
    // Calculate percentage of filled relationships
    const percentageFilled = maxPossibleRelationships > 0 
      ? (filledRelationships / maxPossibleRelationships) * 100 
      : 0;
    
    // Calculate submission progress percentage
    const submissionProgress = Math.min(100, (submissionCount / minSubmissionsRequired) * 100);
    
    setDataStats({
      totalRelationships,
      filledRelationships,
      percentageFilled,
      maxPossibleRelationships,
      submissionProgress
    });
  }, [aggregatedDependencies, matrix.rows.length, matrix.columns.length, submissionCount, minSubmissionsRequired]);

  // Group rows by category
  const rowsByCategory = matrix.rows.reduce((acc, row) => {
    const category = row.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(row);
    return acc;
  }, {} as Record<string, typeof matrix.rows>);

  // Calculate row totals based on aggregated dependencies
  const calculateRowTotals = () => {
    const rowTotals: Record<number, number> = {};
    
    matrix.rows.forEach(row => {
      rowTotals[row.id] = 0;
    });
    
    Object.entries(aggregatedDependencies).forEach(([key, count]) => {
      if (count > 0) {
        const [rowId] = key.split('_').map(Number);
        rowTotals[rowId] = (rowTotals[rowId] || 0) + count;
      }
    });
    
    return rowTotals;
  };

  // Calculate category totals
  const calculateCategoryTotals = (rowTotals: Record<number, number>) => {
    const categoryTotals: Record<string, number> = {};
    
    Object.entries(rowsByCategory).forEach(([category, rows]) => {
      categoryTotals[category] = rows.reduce((sum, row) => sum + (rowTotals[row.id] || 0), 0);
    });
    
    return categoryTotals;
  };

  // Calculate column totals
  const calculateColumnTotals = () => {
    const columnTotals: Record<number, number> = {};
    
    matrix.columns.forEach(column => {
      columnTotals[column.id] = matrix.rows.reduce((total, row) => {
        const key = `${row.id}_${column.id}`;
        return total + (aggregatedDependencies[key] || 0);
      }, 0);
    });
    
    return columnTotals;
  };

  // Calculate subtotals for each category's columns
  const calculateCategorySubtotals = () => {
    const columnTotals = calculateColumnTotals();
    const subtotals: Record<string, number> = {};
    
    // Create a map of column IDs to their categories
    const columnCategories: Record<number, string> = {};
    matrix.rows.forEach(row => {
      columnCategories[row.id] = row.category;
    });
    
    // Group columns by category
    const columnsByCategory: Record<string, number[]> = {};
    Object.keys(rowsByCategory).forEach(category => {
      columnsByCategory[category] = [];
    });
    
    matrix.columns.forEach(column => {
      const category = columnCategories[column.id];
      if (category && columnsByCategory[category]) {
        columnsByCategory[category].push(column.id);
      }
    });
    
    // Calculate subtotals for each category
    Object.entries(columnsByCategory).forEach(([category, columns]) => {
      subtotals[category] = columns.reduce((sum, colId) => {
        return sum + (columnTotals[colId] || 0);
      }, 0);
    });
    
    return subtotals;
  };

  // Calculate normalization for categories
  useEffect(() => {
    const rowTotals = calculateRowTotals();
    const categoryTotals = calculateCategoryTotals(rowTotals);
    const subtotals = calculateCategorySubtotals();
    setCategorySubtotals(subtotals);

    // Calculate category weights using category total + subtotal
    const weights: Record<string, number> = {};
    Object.entries(rowsByCategory).forEach(([category, rows]) => {
      // Total is category total + subtotal, divided by number of rows
      const total = categoryTotals[category] + (subtotals[category] || 0);
      weights[category] = total / rows.length;
    });

    // Apply min-max normalization formula (range 1-9)
    const normalized: Record<string, number> = {};
    const weightValues = Object.values(weights);
    const minWeight = Math.min(...weightValues);
    const maxWeight = Math.max(...weightValues);

    Object.entries(weights).forEach(([category, value]) => {
      if (maxWeight === minWeight) {
        normalized[category] = 1; // Jika semua sama, set ke 1
      } else {
        normalized[category] = ((value - minWeight) * (9 - 1) / (maxWeight - minWeight)) + 1;
      }
    });

    // Calculate comparison values (relative importance)
    const comparison: Record<string, number> = {};

    // Find the maximum normalized value
    const maxNormalized = Math.max(...Object.values(normalized));

    // Calculate the ratio for each category compared to the maximum value
    Object.entries(normalized).forEach(([category, value]) => {
      comparison[category] = Number((value / maxNormalized).toFixed(2));
    });

    setCategoryWeights(weights);
    setNormalizedData(normalized);
    setComparisonValues(comparison);

    // Set the first category as selected by default if none is selected
    if (!selectedCategory && Object.keys(rowsByCategory).length > 0) {
      setSelectedCategory(Object.keys(rowsByCategory)[0]);
    }
  }, [matrix, minValue, maxValue, newMinValue, newMaxValue, aggregatedDependencies]);

  // Calculate sub-attribute weights when a category is selected
  useEffect(() => {
    if (!selectedCategory) return;
    
    const categoryRows = matrix.rows.filter(row => row.category === selectedCategory);
    if (!categoryRows.length) return;
    
    // Calculate row totals for sub-attributes
    const rowTotals: Record<number, number> = {};
    
    categoryRows.forEach(row => {
      let total = 0;
      matrix.columns.forEach(column => {
        const key = `${row.id}_${column.id}`;
        if (aggregatedDependencies[key] && aggregatedDependencies[key] > 0) {
          total += aggregatedDependencies[key];
        }
      });
      rowTotals[row.id] = total;
    });
    
    // Calculate weights
    const weights: Record<number, number> = {};
    categoryRows.forEach(row => {
      weights[row.id] = rowTotals[row.id];
    });
    
    // Apply min-max normalization
    const normalized: Record<number, number> = {};
    const weightValues = Object.values(weights);
    const minWeight = Math.min(...weightValues);
    const maxWeight = Math.max(...weightValues);
    
    Object.entries(weights).forEach(([rowId, weight]) => {
      // Handle case where all weights are the same
      if (maxWeight === minWeight) {
        normalized[Number(rowId)] = newMinValue;
      } else {
        const normalizedValue = ((weight - minWeight) * (newMaxValue - newMinValue) / (maxWeight - minWeight)) + newMinValue;
        normalized[Number(rowId)] = normalizedValue;
      }
    });
    
    // Calculate comparison matrix
    const comparisons: Record<string, Record<string, number>> = {};
    
    categoryRows.forEach(row1 => {
      comparisons[row1.id.toString()] = {};
      
      categoryRows.forEach(row2 => {
        if (row1.id === row2.id) {
          comparisons[row1.id.toString()][row2.id.toString()] = 0; // Diagonal
        } else {
          const value1 = normalized[row1.id] || 0;
          const value2 = normalized[row2.id] || 0;
          
          if (value2 > 0) {
            comparisons[row1.id.toString()][row2.id.toString()] = Number((value1 / value2).toFixed(2));
          } else {
            comparisons[row1.id.toString()][row2.id.toString()] = 0;
          }
        }
      });
    });
    
    setSubAttributeWeights(weights);
    setSubAttributeNormalized(normalized);
    setSubAttributeComparisons(comparisons);
  }, [selectedCategory, matrix, minValue, maxValue, newMinValue, newMaxValue, aggregatedDependencies]);

  return (
    <div className="bg-white rounded-lg p-3 md:p-6 max-w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold">Matrix Normalization</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="mt-2 md:mt-0 px-3 py-1 md:px-4 md:py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            Close
          </button>
        )}
      </div>
      
      {/* Statistics Section */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="text-md md:text-lg font-semibold mb-2">Data Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
          <div className="bg-white p-2 rounded shadow-sm">
            <p className="text-sm text-gray-500">Total Dependencies</p>
            <p className="text-lg font-bold">{dataStats.totalRelationships}</p>
          </div>
          <div className="bg-white p-2 rounded shadow-sm">
            <p className="text-sm text-gray-500">Filled Cells</p>
            <p className="text-lg font-bold">{dataStats.filledRelationships} / {dataStats.maxPossibleRelationships}</p>
            <p className="text-xs text-gray-400">({dataStats.percentageFilled.toFixed(1)}%)</p>
          </div>
          <div className="bg-white p-2 rounded shadow-sm">
            <p className="text-sm text-gray-500">Submissions</p>
            <p className="text-lg font-bold">{submissionCount}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: submissionCount > 0 ? '100%' : '0%' }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rest of the component with responsive adjustments */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-2">Data Collection Progress</h4>
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">
              Submissions: {submissionCount}
            </span>
            <span className="text-xs font-medium text-gray-700">
              {submissionCount > 0 ? '100%' : '0%'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="h-2.5 rounded-full bg-green-600"
              style={{ width: submissionCount > 0 ? '100%' : '0%' }}
            ></div>
          </div>
        </div>
        
        {/* Display data statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded shadow">
            <div className="text-xs text-gray-600">Total Submissions</div>
            <div className="text-2xl font-bold text-blue-600">{submissionCount}</div>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <div className="text-xs text-gray-600">Filled Relationships</div>
            <div className="text-2xl font-bold text-green-600">{dataStats.filledRelationships}</div>
            <div className="text-xs text-gray-500">of {dataStats.maxPossibleRelationships} possible</div>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <div className="text-xs text-gray-600">Total Relationships</div>
            <div className="text-2xl font-bold text-purple-600">{dataStats.totalRelationships}</div>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <div className="text-xs text-gray-600">Coverage</div>
            <div className="text-2xl font-bold text-orange-600">{dataStats.percentageFilled.toFixed(1)}%</div>
          </div>
        </div>
      </div>
      
      {/* Always show normalization UI */}
      <div>
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Normalization Parameters</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Original Min Value
                </label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(Number(e.target.value))}
                  className="w-full p-1 md:p-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Original Max Value
                </label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(Number(e.target.value))}
                  className="w-full p-1 md:p-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  New Min Value
                </label>
                <input
                  type="number"
                  value={newMinValue}
                  onChange={(e) => setNewMinValue(Number(e.target.value))}
                  className="w-full p-1 md:p-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  New Max Value
                </label>
                <input
                  type="number"
                  value={newMaxValue}
                  onChange={(e) => setNewMaxValue(Number(e.target.value))}
                  className="w-full p-1 md:p-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Category Normalization Results */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2">Category Normalization Results</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Category</th>
                    <th className="border border-gray-300 p-2 text-center">Sub-Attributes</th>
                    <th className="border border-gray-300 p-2 text-center">Category Total</th>
                    <th className="border border-gray-300 p-2 text-center">Sub Total</th>
                    <th className="border border-gray-300 p-2 text-center">Combined Total</th>
                    <th className="border border-gray-300 p-2 text-center">Weight</th>
                    <th className="border border-gray-300 p-2 text-center">Normalized Value</th>
                    <th className="border border-gray-300 p-2 text-center">Comparison Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(rowsByCategory).map(([category, rows]) => {
                    const rowTotals = calculateRowTotals();
                    const categoryTotals = calculateCategoryTotals(rowTotals);
                    const combinedTotal = categoryTotals[category] + (categorySubtotals[category] || 0);
                    return (
                      <tr 
                        key={category} 
                        className={`cursor-pointer hover:bg-gray-50 ${selectedCategory === category ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <td className="border border-gray-300 p-2 font-medium">{category}</td>
                        <td className="border border-gray-300 p-2 text-center">{rows.length}</td>
                        <td className="border border-gray-300 p-2 text-center">{categoryTotals[category] || 0}</td>
                        <td className="border border-gray-300 p-2 text-center">{categorySubtotals[category] || 0}</td>
                        <td className="border border-gray-300 p-2 text-center font-bold">{combinedTotal}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          {categoryWeights[category] ? categoryWeights[category].toFixed(1) : '0.0'}
                        </td>
                        <td className="border border-gray-300 p-2 text-center font-bold">
                          {normalizedData[category] ? normalizedData[category].toFixed(1) : '0.0'}
                        </td>
                        <td className="border border-gray-300 p-2 text-center font-bold">
                          {comparisonValues[category] ? comparisonValues[category].toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Category Comparison Matrix */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2">Category Comparison Matrix</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-center"></th>
                    {Object.keys(rowsByCategory).map(category => (
                      <th key={category} className="border border-gray-300 p-2 text-center">{category}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(rowsByCategory).map((rowCategory, rowIdx) => (
                    <tr key={rowCategory}>
                      <td className="border border-gray-300 p-2 font-medium">{rowCategory}</td>
                      {Object.keys(rowsByCategory).map((colCategory, colIdx) => {
                        // Hanya tampilkan angka di atas diagonal utama
                        if (rowIdx < colIdx) {
                          const rowValue = normalizedData[rowCategory] || 0;
                          const colValue = normalizedData[colCategory] || 0;
                          const comparisonValue = colValue > 0 ? Number((rowValue / colValue).toFixed(2)) : 0;
                          return (
                            <td 
                              key={colCategory} 
                              className={`border border-gray-300 p-2 text-center ${
                                comparisonValue > 1 ? 'text-green-600' : 'text-black'
                              }`}
                            >
                              {comparisonValue.toFixed(2)}
                            </td>
                          );
                        }
                        // Diagonal dan bawah diagonal tampilkan '-'
                        return (
                          <td key={colCategory} className="border border-gray-300 p-2 text-center bg-gray-100">-</td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Sub-attribute Normalization */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2">Sub-Attribute Normalization for: 
              <span className="ml-2 text-blue-600">{selectedCategory}</span>
            </h4>
            
            {/* Category selection buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(rowsByCategory).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-sm rounded ${
                    selectedCategory === category 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {selectedCategory && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 border-b text-left">Sub-Attribute</th>
                      <th className="py-2 px-4 border-b text-right">Weight</th>
                      <th className="py-2 px-4 border-b text-right">Normalized Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.rows
                      .filter(row => row.category === selectedCategory)
                      .map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">{row.name}</td>
                          <td className="py-2 px-4 border-b text-right">
                            {subAttributeWeights[row.id] || 0}
                          </td>
                          <td className="py-2 px-4 border-b text-right">
                            {subAttributeNormalized[row.id]?.toFixed(1) || '0.0'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Sub-Attribute Comparison Matrix */}
          {selectedCategory && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">Sub-Attribute Comparison Matrix</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2"></th>
                      {matrix.rows
                        .filter(row => row.category === selectedCategory)
                        .map((row) => (
                          <th key={row.id} className="border border-gray-300 p-2 text-center">{row.name}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.rows
                      .filter(row => row.category === selectedCategory)
                      .map((row1) => (
                        <tr key={row1.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 font-medium">{row1.name}</td>
                          {matrix.rows
                            .filter(row => row.category === selectedCategory)
                            .map((row2) => {
                              const compValue = subAttributeComparisons[row1.id]?.[row2.id] || 0;
                              
                              return (
                                <td 
                                  key={`${row1.id}_${row2.id}`} 
                                  className={`border border-gray-300 p-2 text-center ${
                                    row1.id === row2.id ? 'bg-gray-100' : 
                                    row1.id < row2.id && compValue > 1 ? 'text-green-600' : ''
                                  }`}
                                >
                                  {row1.id === row2.id ? '-' : 
                                   row1.id < row2.id ? compValue.toFixed(2) : ''}
                                </td>
                              );
                            })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}