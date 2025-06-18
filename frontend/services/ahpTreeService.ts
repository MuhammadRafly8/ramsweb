import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/ahp-tree`
  : "http://localhost:5000/api/ahp-tree";

export const ahpTreeService = {
  async create(title: string, treeData: unknown) {
    const res = await axios.post(API_URL, { title, treeData }, { withCredentials: true });
    return res.data;
  },
  async getAll() {
    const res = await axios.get(API_URL, { withCredentials: true });
    return res.data;
  },
  async getById(id: string) {
    const res = await axios.get(`${API_URL}/${id}`, { withCredentials: true });
    return res.data;
  },
  async update(id: string, title: string, treeData: unknown) {
    const res = await axios.put(`${API_URL}/${id}`, { title, treeData }, { withCredentials: true });
    return res.data;
  },
  async remove(id: string) {
    const res = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    return res.data;
  }
};