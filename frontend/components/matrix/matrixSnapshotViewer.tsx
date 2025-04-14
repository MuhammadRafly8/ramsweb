import { Fragment } from 'react';
import { StructuredMatrix } from '../../types/matrix';

interface MatrixSnapshotViewerProps {
  matrix: StructuredMatrix;
  onClose?: () => void;
  showHeader?: boolean;
}

export default function MatrixSnapshotViewer({ 
  matrix, 
  onClose, 
  showHeader = true 
}: MatrixSnapshotViewerProps) {
  // Group rows by category
  const rowsByCategory = matrix.rows.reduce((acc, row) => {
    const category = row.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(row);
    return acc;
  }, {} as Record<string, typeof matrix.rows>);
  
  // Calculate row totals
  const rowTotals: Record<number, number> = {};
  matrix.rows.forEach(row => {
    rowTotals[row.id] = 0;
  });
  
  Object.entries(matrix.dependencies).forEach(([key, value]) => {
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
    matrix.columns.forEach(column => {
      const key = `${rowId}_${column.id}`;
      if (matrix.dependencies[key] && column.id < rowId) {
        count++;
      }
    });
    return count;
  };

  return (
    <div className="bg-white rounded-lg p-4 w-full h-full overflow-hidden flex flex-col">
      {showHeader && (
        <>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold">
              Matrix Snapshot 
              <span className="text-sm ml-2 text-gray-600">
                ({matrix.rows.length} sub-attributes × {matrix.columns.length} columns)
              </span>
            </h3>
            {onClose && (
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            )}
          </div>
          
          <div className="mb-2 text-xs text-gray-600">
            <p>This is a snapshot of the matrix at the time of submission.</p>
          </div>
        </>
      )}
      
      <div className="overflow-auto flex-grow">
        <div className="min-w-max">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1 text-center">ID</th>
                <th className="border border-gray-300 p-1 text-left">Sub-Attribute</th>
                <th className="border border-gray-300 p-1 text-center">Category</th>
                <th className="border border-gray-300 p-1 text-center">Relation To</th>
                {matrix.columns.map((column) => (
                  <th 
                    key={column.id} 
                    className={`border border-gray-300 p-1 text-center ${
                      column.id % 5 === 0 ? 'border-r border-r-gray-300' : ''
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
              {Object.entries(rowsByCategory).map(([category, rows]) => (
                <Fragment key={category}>
                  {rows.map((row, rowIndex) => (
                    <tr key={row.id} className={row.id % 5 === 0 ? 'border-b border-b-gray-300' : ''}>
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
                      {matrix.columns.map((column) => {
                        const key = `${row.id}_${column.id}`;
                        const value = Boolean(matrix.dependencies[key]);
                        const isDisabled = row.id === column.id || row.id > column.id;
                        const isGreen = row.id > column.id;
                        
                        // Removed visual separator at the diagonal
                        
                        return (
                          <td 
                            key={key} 
                            className={`border border-gray-300 p-0 text-center ${
                              isDisabled ? (isGreen ? 'bg-green-800' : 'bg-gray-200') : (value ? 'bg-green-800' : 'bg-white')
                            } ${
                              column.id % 5 === 0 ? 'border-r border-r-gray-300' : ''
                            }`}
                            style={{ width: '20px', height: '20px', maxWidth: '30px' }}
                          >
                            {value && !isDisabled ? 'x' : ''}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 p-1 text-center font-semibold">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}