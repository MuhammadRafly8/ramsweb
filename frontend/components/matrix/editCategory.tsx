import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface EditCategoryProps {
  categories: string[];
  onSave: (categories: string[]) => void;
  onCancel: () => void;
}

export default function EditCategory({ categories, onSave, onCancel }: EditCategoryProps) {
  const [editedCategories, setEditedCategories] = useState<string[]>([...categories]);
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }

    if (editedCategories.includes(newCategory)) {
      toast.error('Kategori sudah ada');
      return;
    }

    setEditedCategories([...editedCategories, newCategory]);
    setNewCategory('');
  };

  const handleRemoveCategory = (index: number) => {
    const updatedCategories = [...editedCategories];
    updatedCategories.splice(index, 1);
    setEditedCategories(updatedCategories);
  };

  const handleEditCategory = (index: number, value: string) => {
    if (!value.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }

    const updatedCategories = [...editedCategories];
    updatedCategories[index] = value;
    setEditedCategories(updatedCategories);
  };

  const handleSave = () => {
    onSave(editedCategories);
  };

  return (
    <div className="bg-white rounded-lg p-3 md:p-6 w-full max-w-md">
      <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Edit Kategori</h3>
      
      <div className="mb-3 md:mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategori Saat Ini
        </label>
        <div className="space-y-2">
          {editedCategories.map((category, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={category}
                onChange={(e) => handleEditCategory(index, e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded text-sm md:text-base"
              />
              <button
                onClick={() => handleRemoveCategory(index)}
                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs md:text-sm"
                title="Hapus kategori"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-3 md:mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tambah Kategori Baru
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded text-sm md:text-base"
            placeholder="Nama kategori baru"
          />
          <button
            onClick={handleAddCategory}
            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs md:text-sm"
          >
            Tambah
          </button>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 mt-4 md:mt-6">
        <button
          onClick={onCancel}
          className="px-3 py-1 md:px-4 md:py-2 border border-gray-300 rounded hover:bg-gray-100 text-sm md:text-base"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 md:px-4 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm md:text-base"
        >
          Simpan
        </button>
      </div>
    </div>
  );
}