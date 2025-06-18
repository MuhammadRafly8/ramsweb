"use client";
import React, { useEffect, useState } from "react";
import { ahpTreeService } from "../../services/ahpTreeService";

interface AhpTree {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function AhpTreeList({ onSelect }: { onSelect: (id: string) => void }) {
  const [trees, setTrees] = useState<AhpTree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ahpTreeService.getAll()
      .then(setTrees)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white p-4 rounded shadow max-w-2xl mx-auto mb-6">
      <h2 className="text-lg font-bold mb-2">Daftar Pohon AHP</h2>
      {loading ? (
        <div>Loading...</div>
      ) : trees.length === 0 ? (
        <div>Belum ada pohon AHP yang disimpan.</div>
      ) : (
        <ul>
          {trees.map(tree => (
            <li key={tree.id} className="mb-2 flex items-center">
              <button
                className="text-blue-700 underline mr-2"
                onClick={() => onSelect(tree.id)}
              >
                {tree.title}
              </button>
              <span className="text-xs text-gray-500">
                (dibuat: {new Date(tree.createdAt).toLocaleString()})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}