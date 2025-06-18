"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ahpTreeService } from "../../../services/ahpTreeService";
import AHPExpertChoiceTree from "../../../components/ahp/AHP";

export default function AhpRamsDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [treeData, setTreeData] = useState<unknown>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      ahpTreeService.getById(id).then(data => {
        setTreeData(data.treeData);
        setTitle(data.title);
        setLoading(false);
      });
    }
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <AHPExpertChoiceTree tree={treeData} readOnly />
      )}
    </div>
  );
}