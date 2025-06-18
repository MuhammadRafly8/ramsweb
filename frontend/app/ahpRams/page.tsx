"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ahpTreeService } from "../../services/ahpTreeService";

interface AhpTree {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function AhpRamsListPage() {
  const [trees, setTrees] = useState<AhpTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    ahpTreeService
      .getAll()
      .then(setTrees)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pohon ini?")) return;
    setDeletingId(id);
    try {
      await ahpTreeService.remove(id);
      setTrees((trees) => trees.filter((tree) => tree.id !== id));
    } catch {
      alert("Gagal menghapus data.");
    }
    setDeletingId(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Daftar Pohon AHP</h1>
      <Link
        href="/ahpRams/create"
        className="bg-green-600 text-white px-4 py-2 rounded mb-4 inline-block"
      >
        + Buat Pohon AHP Baru
      </Link>
      {loading ? (
        <div>Loading...</div>
      ) : trees.length === 0 ? (
        <div className="mt-4 text-gray-500">
          Belum ada pohon AHP yang disimpan.
        </div>
      ) : (
        <table className="w-full mt-4 border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Judul</th>
              <th className="py-2 px-4 border">Tanggal Dibuat</th>
              <th className="py-2 px-4 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {trees.map((tree) => (
              <tr key={tree.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border">{tree.title}</td>
                <td className="py-2 px-4 border">
                  {new Date(tree.createdAt).toLocaleString()}
                </td>
                <td className="py-2 px-4 border flex gap-2">
                  <Link
                    href={`/ahpRams/${tree.id}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Lihat Detail
                  </Link>
                  <button
                    onClick={() => handleDelete(tree.id)}
                    disabled={deletingId === tree.id}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    {deletingId === tree.id ? "Menghapus..." : "Hapus"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}