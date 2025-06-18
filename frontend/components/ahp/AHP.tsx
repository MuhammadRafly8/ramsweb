"use client";
import React, { useState } from "react";
import { ahpTreeService } from '../../services/ahpTreeService';

type NodeType = "goal" | "category" | "sub";

interface AHPNode {
  id: string;
  type: NodeType;
  name: string;
  weight?: number; 
  children?: AHPNode[];
}

const nodeColors: Record<NodeType, string> = {
  goal: "#FFD700",      
  category: "#FF9900",  
  sub: "#C00000",       
};

const nodeIcons: Record<NodeType, string> = {
  goal: "🟦",
  category: "🟧",
  sub: "🟥",
};

function EditableLabel({
  value,
  onChange,
  color,
  bold = false,
}: {
  value: string;
  onChange: (v: string) => void;
  color: string;
  bold?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);

  return editing ? (
    <input
      autoFocus
      value={temp}
      onChange={e => setTemp(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onChange(temp);
      }}
      onKeyDown={e => {
        if (e.key === "Enter") {
          setEditing(false);
          onChange(temp);
        }
      }}
      style={{
        fontWeight: bold ? "bold" : undefined,
        background: color,
        border: "1px solid #aaa",
        borderRadius: 4,
        padding: "2px 4px",
        minWidth: 40,
      }}
    />
  ) : (
    <span
      style={{
        background: color,
        color: "#222",
        fontWeight: bold ? "bold" : undefined,
        borderRadius: 4,
        padding: "2px 6px",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => setEditing(true)}
      title="Klik untuk edit nama"
    >
      {value}
    </span>
  );
}

function renderNode(
  node: AHPNode,
  onChange: (id: string, value: number) => void,
  onNameChange: (id: string, name: string) => void,
  onAdd: (parentId: string, type: NodeType) => void,
  onDelete: (id: string) => void,
  level = 0
) {
  const icon = nodeIcons[node.type];
  const color = nodeColors[node.type];

  return (
    <div
      key={node.id}
      style={{
        marginLeft: level === 0 ? 0 : 24,
        borderLeft: level > 0 ? "2px solid #bbb" : undefined,
        paddingLeft: level > 0 ? 16 : 0,
        marginTop: 4,
        marginBottom: 4,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 18, marginRight: 6 }}>{icon}</span>
        <EditableLabel
          value={node.name}
          onChange={name => onNameChange(node.id, name)}
          color={color}
          bold={node.type === "goal"}
        />
        {node.type === "sub" && (
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={node.weight ?? 0}
            onChange={e => onChange(node.id, parseFloat(e.target.value))}
            style={{
              width: 60,
              marginLeft: 8,
              border: "1px solid #aaa",
              borderRadius: 4,
              padding: "2px 4px",
            }}
          />
        )}
        {(node.type === "goal" || node.type === "category") && (
          <button
            style={{
              marginLeft: 8,
              background: "#e0e0e0",
              border: "1px solid #bbb",
              borderRadius: 4,
              padding: "2px 8px",
              cursor: "pointer",
              fontSize: 13,
            }}
            onClick={() => onAdd(node.id, node.type === "goal" ? "category" : "sub")}
          >
            + {node.type === "goal" ? "Kategori" : "Sub"}
          </button>
        )}
        {(node.type === "category" || node.type === "sub") && (
          <button
            style={{
              marginLeft: 8,
              background: "#ffdddd",
              border: "1px solid #ff8888",
              borderRadius: 4,
              padding: "2px 8px",
              cursor: "pointer",
              fontSize: 13,
              color: "#c00"
            }}
            onClick={() => onDelete(node.id)}
            title="Hapus"
          >
            Hapus
          </button>
        )}
      </div>
      {/* Render children secara hierarki */}
      <div>
        {node.children?.map(child =>
          renderNode(child, onChange, onNameChange, onAdd, onDelete, level + 1)
        )}
      </div>
    </div>
  );
}

export default function AHPExpertChoiceTree() {
  const [tree, setTree] = useState<AHPNode | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Update bobot sub
  const handleWeightChange = (id: string, value: number) => {
    if (!tree) return;
    const update = (node: AHPNode): AHPNode => {
      if (node.id === id && node.type === "sub") {
        return { ...node, weight: value };
      }
      if (node.children) {
        return { ...node, children: node.children.map(update) };
      }
      return node;
    };
    setTree(update(tree));
  };

  // Update nama node
  const handleNameChange = (id: string, name: string) => {
    if (!tree) return;
    const update = (node: AHPNode): AHPNode => {
      if (node.id === id) {
        return { ...node, name };
      }
      if (node.children) {
        return { ...node, children: node.children.map(update) };
      }
      return node;
    };
    setTree(update(tree));
  };

  // Tambah kategori/sub
  const handleAdd = (parentId: string, type: NodeType) => {
    if (!tree) return;
    const add = (node: AHPNode): AHPNode => {
      if (node.id === parentId) {
        const newId = Math.random().toString(36).slice(2, 9);
        if (type === "category") {
          return {
            ...node,
            children: [
              ...(node.children || []),
              { id: newId, type: "category", name: "Kategori Baru", children: [] },
            ],
          };
        } else if (type === "sub") {
          return {
            ...node,
            children: [
              ...(node.children || []),
              { id: newId, type: "sub", name: "Sub Baru", weight: 0 },
            ],
          };
        }
      }
      if (node.children) {
        return { ...node, children: node.children.map(add) };
      }
      return node;
    };
    setTree(add(tree));
  };

  // Hapus node
  const handleDelete = (id: string) => {
    if (!tree) return;
    const remove = (node: AHPNode): AHPNode => {
      if (node.children) {
        return {
          ...node,
          children: node.children.filter(child => child.id !== id).map(remove),
        };
      }
      return node;
    };
    setTree(remove(tree));
  };

  // Hitung total bobot per kategori
  const getCategoryTotals = (node: AHPNode) => {
    if (node.type === "category" && node.children) {
      return node.children.reduce((sum, sub) => sum + (sub.weight || 0), 0);
    }
    return 0;
  };

  // Fungsi simpan ke backend
  const handleSave = async () => {
    if (!tree || !title) {
      setMessage("Isi judul dan buat pohon AHP terlebih dahulu.");
      return;
    }
    setSaving(true);
    try {
      await ahpTreeService.create(title, tree);
      setMessage("Berhasil disimpan!");
    } catch (err) {
      setMessage("Gagal menyimpan.");
    }
    setSaving(false);
  };

  return (
    <div className="bg-white p-4 rounded shadow max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">AHP Expert Choice Tree</h2>
      <div className="mb-2">
        <input
          type="text"
          placeholder="Judul Goal/Project"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border px-2 py-1 rounded mr-2"
          style={{ minWidth: 200 }}
        />
        <button
          onClick={handleSave}
          disabled={saving || !tree || !title}
          className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        {message && <span className="ml-4 text-sm">{message}</span>}
      </div>
      <div style={{ fontFamily: "Segoe UI, Arial, sans-serif", fontSize: 15 }}>
        {!tree ? (
          <button
            onClick={() =>
              setTree({
                id: "goal",
                type: "goal",
                name: "Goal: ...",
                children: [],
              })
            }
            style={{
              background: "#FFD700",
              color: "#222",
              fontWeight: "bold",
              border: "1px solid #aaa",
              borderRadius: 6,
              padding: "8px 20px",
              fontSize: 18,
              marginTop: 40,
              marginBottom: 40,
              cursor: "pointer",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            + Tambah Goal
          </button>
        ) : (
          renderNode(tree, handleWeightChange, handleNameChange, handleAdd, handleDelete)
        )}
      </div>
      {tree && (
        <div className="mt-6">
          <h3 className="font-semibold">Total Bobot per Kategori:</h3>
          <ul>
            {tree.children?.map(cat =>
              cat.type === "category" ? (
                <li key={cat.id}>
                  {cat.name}: {getCategoryTotals(cat).toFixed(3)}
                </li>
              ) : null
            )}
          </ul>
        </div>
      )}
    </div>
  );
}