// @ts-nocheck
import { useState, useEffect } from "react";
import { Plus, Tag, X, ImagePlus, ShoppingCart, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Card, PageHeader, getSession } from "../index";

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default function Categories() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoriesList, setCategoriesList] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories/list`);
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setCategoryName(c.name);
    setImagePreview(typeof c.emoji === 'string' && (c.emoji.startsWith('http') || c.emoji.startsWith('blob')) ? c.emoji : null);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        const session = getSession();
        const token = session?.token;
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}/api/categories/delete/${deletingId}`, {
          method: "DELETE",
          headers,
        });

        if (res.ok) {
          setCategoriesList(categoriesList.filter(c => c.id !== deletingId));
          setToastMessage("Category deleted");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } else {
          const errData = await res.json();
          alert(errData.message || "Failed to delete category");
        }
      } catch (err) {
        console.error("Error deleting category:", err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleSave = async () => {
    if (!categoryName.trim()) return;

    try {
      const session = getSession();
      const token = session?.token;
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const formData = new FormData();
      formData.append("name", categoryName.trim());
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      if (editingId) {
        const res = await fetch(`${API_BASE}/api/categories/update/${editingId}`, {
          method: "PUT",
          headers,
          body: formData,
        });

        if (res.ok) {
          fetchCategories();
          setToastMessage("Category updated");
          setIsModalOpen(false);
          setCategoryName("");
          setImagePreview(null);
          setSelectedFile(null);
          setEditingId(null);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } else {
          const errData = await res.json();
          alert(errData.message || "Failed to update category");
        }
      } else {
        const res = await fetch(`${API_BASE}/api/categories/add`, {
          method: "POST",
          headers,
          body: formData,
        });

        if (res.ok) {
          fetchCategories();
          setToastMessage("Category added");
          setIsModalOpen(false);
          setCategoryName("");
          setImagePreview(null);
          setSelectedFile(null);
          setEditingId(null);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } else {
          const errData = await res.json();
          alert(errData.message || "Failed to add category");
        }
      }
    } catch (err) {
      console.error("Error saving category:", err);
      alert("An error occurred while saving the category.");
    }
  };

  const safeList = categoriesList || [];

  return (
    <div>
      <PageHeader title="Categories" subtitle="Manage product categories" />
      <div className="mb-6 flex items-center justify-between">
        <div className="text-slate-500">{safeList.length} categories total</div>
        <button 
          onClick={() => {
            setEditingId(null);
            setCategoryName("");
            setImagePreview(null);
            setSelectedFile(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-colors cursor-pointer"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {safeList.map((c) => {
          const isImageUrl = typeof c.emoji === 'string' && (c.emoji.startsWith('http') || c.emoji.startsWith('blob'));
          const renderEmoji = isImageUrl ? <img src={c.emoji} className="w-full h-full object-cover" alt={c.name} /> : (typeof c.emoji === 'string' ? c.emoji : "📦");

          return (
            <Card key={c.id} className="group relative hover:border-emerald-100 transition-colors overflow-hidden !pb-14">
              <div className="flex h-14 w-14 overflow-hidden items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                {renderEmoji}
              </div>
              <div className="mt-5 text-[17px] font-bold text-slate-900 dark:text-white">{c.name}</div>
              <div className="mt-1 text-[13px] text-slate-500">{c.productCount} products</div>

              {/* Hover Actions Pill */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-200">
                <div className="flex w-full items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-1 shadow-sm">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer">
                    <Pencil size={14} /> Edit
                  </button>
                  <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                  <button onClick={(e) => { e.stopPropagation(); setDeletingId(c.id); }} className="flex items-center justify-center rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor: 'rgba(30,30,30,0.92)'}}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Category</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this category? This action cannot be undone.</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor: 'rgba(30,30,30,0.92)'}}>
          <div className="bg-white rounded-[24px] w-full max-w-[460px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-7">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">{editingId ? 'Edit category' : 'Add category'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[15px] font-medium text-slate-900 mb-3">Category image</label>
                  <div className="flex items-center gap-4 rounded-[20px] border border-dashed border-slate-200 p-5 bg-white">
                    <div className="flex h-16 w-16 overflow-hidden items-center justify-center rounded-[18px] bg-primary/10 text-muted-foreground shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingCart size={28} />
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                        <ImagePlus size={16} className="text-slate-900" /> Change
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[15px] font-medium text-slate-900 mb-3">Name</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full rounded-full border border-border bg-background px-5 py-3.5 text-[15px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-[15px] font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!categoryName.trim()}
                  className="rounded-full bg-primary px-6 py-2.5 text-[15px] font-medium text-primary-foreground hover:opacity-90 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-16 right-6 z-[60] flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 px-5 py-4 shadow-lg animate-in slide-in-from-top-4 fade-in duration-300 min-w-[240px]">
          <CheckCircle2 size={22} className="shrink-0 text-primary" />
          <span className="font-semibold text-[15px] text-primary">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
