"use client";
import { useState } from "react";
import { ahpTreeService } from "../../../services/ahpTreeService";
import AHPExpertChoiceTree from "../../../components/ahp/AHP";

export default function AhpRamsCreatePage() {
  const [tree, setTree] = useState<unknown>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    if (!tree || !title) {
      setMessage("Isi judul dan buat pohon AHP terlebih dahulu.");
      return;
    }
    setSaving(true);
    try {
      await ahpTreeService.create(title, tree);
      setMessage("Berhasil disimpan!");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setMessage("Gagal menyimpan.");
    }
    setSaving(false);
  };

  return (
    <AHPExpertChoiceTree
      tree={tree}
      setTree={setTree}
      title={title}
      setTitle={setTitle}
      onSave={handleSave}
      saving={saving}
      message={message}
    />
  );
}