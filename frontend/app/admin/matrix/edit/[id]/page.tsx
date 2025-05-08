"use client";

import { useState, useEffect, Fragment, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "../../../../../components/auth/authContext";
import AdminRoute from "../../../../../components/auth/adminRoute";
import { MatrixItem, StructuredMatrix } from "../../../../../types/matrix";
import { matrixService } from "../../../../../services/api";
import EditCategory from '../../../../../components/matrix/editCategory';

export default function EditMatrixPage({ params }: { params: { id: string } }) {
  const [matrix, setMatrix] = useState<MatrixItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowTotals, setRowTotals] = useState<Record<number, number>>({});
  const [columnTotals, setColumnTotals] = useState<Record<number, number>>({});
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newSubAttribute, setNewSubAttribute] = useState("");
  const [newSubAttributeCategory, setNewSubAttributeCategory] = useState("Technical/Ops");
  const [newSubAttributeId, setNewSubAttributeId] = useState<number | null>(null);
  const [showAddSubAttributeForm, setShowAddSubAttributeForm] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  useEffect(() => {
    if (matrix) {
      const uniqueCategories = Array.from(
        new Set(matrix.data.rows.map(row => row.category))
      );
      setCategories(uniqueCategories);
    }
  }, [matrix]);
  
  const handleSaveCategories = (newCategories: string[]) => {
    const updatedMatrix = { ...matrix };
    if (updatedMatrix && updatedMatrix.data) {
      updatedMatrix.data.rows = updatedMatrix.data.rows.map(row => {
        if (!newCategories.includes(row.category)) {
          return { ...row, category: newCategories[0] || '' };
        }
        return row;
      });
      setMatrix(updatedMatrix as MatrixItem);
      setCategories(newCategories);
      setShowCategoryModal(false);
      toast.success('Kategori berhasil diperbarui');
      setHasUnsavedChanges(true);
    }
  };
  
  const router = useRouter();
  const matrixId = params.id as string;
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const data = await matrixService.getMatrixById(matrixId);
        setMatrix(data);
        calculateTotals(data.data);
      } catch (error) {
        console.error("Error fetching matrix:", error);
        toast.error("Matrix not found");
        router.push("/admin/matrix");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin()) {
      fetchMatrix();
    } else {
      router.push("/matrix");
      toast.error("You don't have permission to edit this matrix");
    }
  }, [matrixId, router]);

  const calculateTotals = (data: StructuredMatrix) => {
    const rowTotals: Record<number, number> = {};
    const columnTotals: Record<number, number> = {};
    const categoryTotals: Record<string, number> = {};

    data.rows.forEach(row => {
      rowTotals[row.id] = 0;
      if (!categoryTotals[row.category]) {
        categoryTotals[row.category] = 0;
      }
    });
    
    data.columns.forEach(col => {
      columnTotals[col.id] = 0;
    });

    Object.entries(data.dependencies).forEach(([key, value]) => {
      if (value) {
        const [rowId, colId] = key.split('_').map(Number);
        rowTotals[rowId] = (rowTotals[rowId] || 0) + 1;
        columnTotals[colId] = (columnTotals[colId] || 0) + 1;
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

  const handleCellChange = (rowId: number, colId: number) => {
    if (!matrix) return;
    const key = `${rowId}_${colId}`;
    const newValue = !matrix.data.dependencies[key];
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
    setMatrix(updatedMatrix);
    calculateTotals(updatedMatrix.data);
    setHasUnsavedChanges(true);
  };

  const handleSubAttributeChange = (id: number, newName: string) => {
    if (!matrix) return;
    const updatedMatrix = {
      ...matrix,
      data: {
        ...matrix.data,
        rows: matrix.data.rows.map(row => 
          row.id === id ? { ...row, name: newName } : row
        )
      }
    };
    setMatrix(updatedMatrix);
    setHasUnsavedChanges(true);
  };

  const saveChanges = async () => {
    if (!matrix) return;
    try {
      await matrixService.updateMatrix(matrix.id, matrix);
      setHasUnsavedChanges(false);
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    }
  };

  const updateMatrixInfo = (field: string, value: string) => {
    if (!matrix) return;
    setMatrix({
      ...matrix,
      [field]: value
    });
    setHasUnsavedChanges(true);
  };

  const getUniqueCategories = () => {
    if (!matrix) return ["Technical/Ops", "Safety"];
    const categories = new Set<string>();
    matrix.data.rows.forEach(row => {
      if (row.category) {
        categories.add(row.category);
      }
    });
    return Array.from(categories);
  };

  const handleAddSubAttribute = () => {
    if (!matrix || !newSubAttribute) return;
    const existingIds = matrix.data.rows.map(row => row.id);
    if (newSubAttributeId !== null) {
      const idExists = existingIds.includes(newSubAttributeId);
      if (idExists) {
        const updatedRows = [...matrix.data.rows].map(row => {
          if (row.id >= newSubAttributeId) {
            return { ...row, id: row.id + 1 };
          }
          return row;
        });
        const updatedColumns = [...matrix.data.columns].map(col => {
          if (col.id >= newSubAttributeId) {
            return { ...col, id: col.id + 1, name: (col.id + 1).toString() };
          }
          return col;
        });
        const updatedDependencies: Record<string, boolean> = {};
        Object.entries(matrix.data.dependencies).forEach(([key, value]) => {
          const [rowId, colId] = key.split('_').map(Number);
          let newRowId = rowId;
          let newColId = colId;
          if (rowId >= newSubAttributeId) {
            newRowId = rowId + 1;
          }
          if (colId >= newSubAttributeId) {
            newColId = colId + 1;
          }
          updatedDependencies[`${newRowId}_${newColId}`] = value;
        });
        updatedRows.splice(newSubAttributeId - 1, 0, {
          id: newSubAttributeId,
          name: newSubAttribute,
          category: showCustomCategoryInput ? customCategory : newSubAttributeCategory
        });
        updatedColumns.splice(newSubAttributeId - 1, 0, {
          id: newSubAttributeId,
          name: newSubAttributeId.toString()
        });
        const updatedMatrix = {
          ...matrix,
          data: {
            ...matrix.data,
            rows: updatedRows,
            columns: updatedColumns,
            dependencies: updatedDependencies
          }
        };
        setMatrix(updatedMatrix);
        calculateTotals(updatedMatrix.data);
      } else {
        const updatedMatrix = {
          ...matrix,
          data: {
            ...matrix.data,
            rows: [
              ...matrix.data.rows,
              {
                id: newSubAttributeId,
                name: newSubAttribute,
                category: showCustomCategoryInput ? customCategory : newSubAttributeCategory
              }
            ],
            columns: [
              ...matrix.data.columns,
              {
                id: newSubAttributeId,
                name: newSubAttributeId.toString()
              }
            ]
          }
        };
        setMatrix(updatedMatrix);
        calculateTotals(updatedMatrix.data);
      }
    } else {
      const nextId = Math.max(0, ...existingIds) + 1;
      const updatedMatrix = {
        ...matrix,
        data: {
          ...matrix.data,
          rows: [
            ...matrix.data.rows,
            {
              id: nextId,
              name: newSubAttribute,
              category: showCustomCategoryInput ? customCategory : newSubAttributeCategory
            }
          ],
          columns: [
            ...matrix.data.columns,
            {
              id: nextId,
              name: nextId.toString()
            }
          ]
        }
      };
      setMatrix(updatedMatrix);
      calculateTotals(updatedMatrix.data);
    }
    setNewSubAttribute("");
    setNewSubAttributeId(null);
    setShowAddSubAttributeForm(false);
    setCustomCategory("");
    setShowCustomCategoryInput(false);
    setHasUnsavedChanges(true);
  };

  const rowsByCategory = useMemo(() => {
    if (!matrix) return {};
    return matrix.data.rows.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = [];
      }
      acc[row.category].push(row);
      return acc;
    }, {} as Record<string, typeof matrix.data.rows>);
  }, [matrix]);

  if (loading) {
    return (
      <AdminRoute>
        <div className="flex-grow container mx-auto p-4 text-center">
          Loading matrix data...
        </div>
      </AdminRoute>
    );
  }

  if (!matrix) {
    return (
      <AdminRoute>
        <div className="flex-grow container mx-auto p-4 text-center">
          Matrix not found
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Edit Matrix</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Edit Kategori
              </button>
              <button
                onClick={() => router.push("/admin/matrix")}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Back to List
              </button>
              <button
                onClick={saveChanges}
                disabled={!hasUnsavedChanges}
                className={`px-4 py-2 ${
                  hasUnsavedChanges 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-gray-400 cursor-not-allowed"
                } text-white rounded`}
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="mb-6 space-y-4 border-b pb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={matrix.title}
                onChange={(e) => updateMatrixInfo('title', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={matrix.description}
                onChange={(e) => updateMatrixInfo('description', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Keyword
              </label>
              <input
                type="text"
                value={matrix.keyword}
                onChange={(e) => updateMatrixInfo('keyword', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="mb-4">
            <button
              onClick={() => setShowAddSubAttributeForm(!showAddSubAttributeForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {showAddSubAttributeForm ? "Cancel" : "Add Sub-Attribute"}
            </button>
            
            {showAddSubAttributeForm && (
              <div className="mt-2 p-4 border rounded">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID</label>
                    <input
                      type="number"
                      value={newSubAttributeId || ""}
                      onChange={(e) => setNewSubAttributeId(e.target.value ? parseInt(e.target.value) : null)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      placeholder="Leave empty for auto-assign"
                    />
                    {newSubAttributeId !== null && matrix.data.rows.some(row => row.id === newSubAttributeId) && (
                      <p className="text-yellow-600 text-xs mt-1">
                        ID {newSubAttributeId} already exists. Adding will shift existing IDs.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sub-Attribute Name</label>
                    <input
                      type="text"
                      value={newSubAttribute}
                      onChange={(e) => setNewSubAttribute(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    {!showCustomCategoryInput ? (
                      <div className="flex items-center">
                        <select
                          value={newSubAttributeCategory}
                          onChange={(e) => setNewSubAttributeCategory(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        >
                          {getUniqueCategories().map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowCustomCategoryInput(true)}
                          className="ml-2 bg-gray-200 p-2 rounded hover:bg-gray-300"
                          title="Add custom category"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                          placeholder="Enter new category"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomCategoryInput(false)}
                          className="ml-2 bg-gray-200 p-2 rounded hover:bg-gray-300"
                          title="Use existing category"
                        >
                          ←
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={handleAddSubAttribute}
                    disabled={!newSubAttribute}
                    className={`px-4 py-2 rounded ${
                      !newSubAttribute
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1 text-center">ID</th>
                  <th className="border border-gray-300 p-1 text-left">Sub-Attribute</th>
                  <th className="border border-gray-300 p-1 text-center">Category</th>
                  {matrix.data.columns.map((column) => (
                    <th key={column.id} className="border border-gray-300 p-1 text-center">
                      {column.id}
                    </th>
                  ))}
                  <th className="border border-gray-300 p-1 text-center">Total</th>
                  <th className="border border-gray-300 p-1 text-center">Category Total</th>
                  <th className="border border-gray-300 p-1 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(rowsByCategory).map(([category, rows]) => (
                  <Fragment key={category}>
                    {rows.map((row, rowIndex) => (
                      <tr key={row.id}>
                        <td className="border border-gray-300 p-1 text-center text-xs md:text-sm">{row.id}</td>
                        <td className="border border-gray-300 p-1 text-left text-xs md:text-sm">
                          <input 
                            type="text" 
                            value={row.name} 
                            onChange={(e) => handleSubAttributeChange(row.id, e.target.value)}
                            className="w-full p-1 border-b border-gray-300 focus:outline-none focus:border-green-500 text-xs md:text-sm"
                          />
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
                              onClick={() => !isDisabled && handleCellChange(row.id, column.id)}
                              style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', width: '20px', height: '20px', maxWidth: '30px' }}
                            >
                              {value && !isDisabled ? 'x' : ''}
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
                        <td className="border border-gray-300 p-1 text-center">
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete sub-attribute "${row.name}"?`)) {
                                    if (!matrix) return;

                                    const deletedId = row.id;

                                    let updatedRows = matrix.data.rows.filter(r => r.id !== deletedId);
                                    let updatedColumns = matrix.data.columns.filter(c => c.id !== deletedId);

                                    updatedRows = updatedRows.map(r => {
                                      if (r.id > deletedId) {
                                        return { ...r, id: r.id - 1 };
                                      }
                                      return r;
                                    });

                                    updatedColumns = updatedColumns.map(c => {
                                      if (c.id > deletedId) {
                                        return { ...c, id: c.id - 1, name: (c.id - 1).toString() };
                                      }
                                      return c;
                                    });

                                    const updatedDependencies: Record<string, boolean> = {};
                                    Object.entries(matrix.data.dependencies).forEach(([key, value]) => {
                                      const [r, c] = key.split('_').map(Number);
                                      if (r === deletedId || c === deletedId) {
                                        return;
                                      }
                                      const newRowId = r > deletedId ? r - 1 : r;
                                      const newColId = c > deletedId ? c - 1 : c;
                                      updatedDependencies[`${newRowId}_${newColId}`] = value;
                                    });

                                    const updatedMatrix = {
                                      ...matrix,
                                      data: {
                                        ...matrix.data,
                                        rows: updatedRows,
                                        columns: updatedColumns,
                                        dependencies: updatedDependencies
                                      }
                                    };

                                    setMatrix(updatedMatrix);
                                    calculateTotals(updatedMatrix.data);
                                    setHasUnsavedChanges(true);
                                  }}
                                }
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
            
            {showCategoryModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <EditCategory
                  categories={categories}
                  onSave={handleSaveCategories}
                  onCancel={() => setShowCategoryModal(false)}
                />
              </div>
            )}
          </AdminRoute>
        );
      }
