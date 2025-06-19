import React, { useEffect, useState } from "react";
import { getCategories, addCategory, updateCategory, deleteCategory } from "../../api/categories";
import Modal from './components/Modal';

const CategoriesAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getCategories();
      if (response.success && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        setCategories([]);
        setError("Invalid data format received from server");
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError("Failed to load categories.");
      setCategories([]);
    }
    setLoading(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await addCategory(form);
      if (response.success && response.data) {
        setCategories([response.data, ...categories]);
        setShowModal(false);
        setForm({ name: "", description: "" });
      } else {
        throw new Error(response.error?.message || 'Failed to add category');
      }
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.message || "Failed to add category.");
    }
    setLoading(false);
  };

  const openEditModal = (category) => {
    setEditMode(true);
    setEditId(category._id);
    setForm({ name: category.name, description: category.description });
    setShowModal(true);
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const updated = await updateCategory(editId, form);
      setCategories((prev) => prev.map((cat) => (cat._id === updated._id ? updated : cat)));
      setShowModal(false);
      setEditMode(false);
      setEditId(null);
      setForm({ name: "", description: "" });
    } catch (err) {
      setError("Failed to update category.");
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (id) => {
    setLoading(true);
    setError("");
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
    } catch (err) {
      setError("Failed to delete category.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📂 Categories Management</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => { setShowModal(true); setEditMode(false); setForm({ name: "", description: "" }); }}
        >
          + Add Category
        </button>
      </div>
      {loading && <div className="text-blue-600 mb-4">Loading...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <table className="w-full border mt-2">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr><td colSpan={3} className="p-4 text-center text-gray-500">No categories found.</td></tr>
          ) : (
            categories.map((cat) => (
              <tr key={cat._id} className="border-b">
                <td className="p-2">{cat.name}</td>
                <td className="p-2">{cat.description}</td>
                <td className="p-2">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => openEditModal(cat)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDeleteCategory(cat._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Add/Edit Category Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditMode(false); setEditId(null); setForm({ name: '', description: '' }); }}
        title={editMode ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={editMode ? handleEditCategory : handleAddCategory} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              className="border p-2 rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditMode(false); setEditId(null); setForm({ name: '', description: '' }); }}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={!form.name}
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoriesAdmin; 