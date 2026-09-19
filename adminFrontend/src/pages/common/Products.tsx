// @ts-nocheck
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Trash2, X, Upload, UploadCloud, Loader2 } from "lucide-react";
import { Card, PageHeader, getSession } from "../index";
import AddProduct from "./AddProduct";

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function UpdateToast({ message, type = 'success' }) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const inTimer = setTimeout(() => setShow(true), 100);
    const outTimer = setTimeout(() => setShow(false), 2500);
    const unmountTimer = setTimeout(() => setMounted(false), 3000);
    return () => {
      clearTimeout(inTimer);
      clearTimeout(outTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) return null;

  const isError = type === 'error';

  return (
    <div
      style={{
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
        transform: show ? 'translateX(0)' : 'translateX(120%)',
        opacity: show ? 1 : 0,
      }}
      className={`fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-xl px-[18px] py-3.5 shadow-md border ${
        isError
          ? 'bg-rose-50 border-rose-200 dark:bg-slate-900 dark:border-rose-900'
          : 'bg-[#ebfef5] border-emerald-100 dark:bg-slate-900 dark:border-emerald-900'
      }`}
    >
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isError ? 'bg-rose-500' : 'bg-[#10b981]'}`}>
        {isError ? (
          <X className="h-3 w-3 text-white" />
        ) : (
          <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <p className={`text-[15px] font-medium ${isError ? 'text-rose-700 dark:text-rose-300' : 'text-[#065f46] dark:text-emerald-300'}`}>{message}</p>
    </div>
  );
}

function EditProductModal({ product, onClose, onSave, categories: propCategories }) {
  const [name, setName] = useState(product.name || "");
  const [bPrice, setBPrice] = useState(product.originalPrice || "");
  const [category, setCategory] = useState(product.category || "");
  const [unit, setUnit] = useState(product.unit || "1 kg");
  const [stock, setStock] = useState(product.stock || "");
  const [sPrice, setSPrice] = useState(product.price || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(product.image || "");
  const [isDragging, setIsDragging] = useState(false);
  const [description, setDescription] = useState(product.description || "");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeCategories = propCategories || [];
  const categoriesList = activeCategories.map(c => c.name);
  const unitsList = ["1 kg", "1 pack", "1 L", "1 pcs"];

  useEffect(() => {
    if (categoriesList.length > 0) {
      setCategory(prev => prev || categoriesList[0]);
    }
  }, [categoriesList]);

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      if (fileInputRef.current && e.dataTransfer.files) {
        try {
          fileInputRef.current.files = e.dataTransfer.files;
        } catch {
          // ignore
        }
      }
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!name || !stock || !sPrice) {
      alert("Please fill in all required fields.");
      return;
    }

    const file = imageFile || fileInputRef.current?.files?.[0];

    // Check if mock product
    if (product.id.startsWith("p-")) {
      onSave({
        ...product,
        name,
        description,
        category,
        unit,
        price: parseFloat(sPrice),
        originalPrice: parseFloat(bPrice) || 0,
        stock: parseInt(stock, 10),
        active: parseInt(stock, 10) > 0,
        image: imagePreview || product.image,
      });
      onClose();
      return;
    }

    try {
      const session = getSession();
      const token = session?.token;
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description ? description.trim() : "");
      formData.append("price", sPrice);
      formData.append("originalPrice", bPrice || "0");
      formData.append("category", category || categoriesList[0] || "Fruits");
      formData.append("unit", unit || "1 kg");
      formData.append("stock", stock);
      if (file) {
        formData.append("image", file);
      }

      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const res = await fetch(`${base}/api/products/update/${product.id}`, {
        method: "PUT",
        headers,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();

        const updatedProduct = data.product;
        const mappedProd = {
          id: updatedProduct.id,
          sku: `SKU-${updatedProduct.id.slice(0, 4).toUpperCase()}`,
          name: updatedProduct.name,
          description: updatedProduct.description,
          category: updatedProduct.category?.name || category,
          unit: updatedProduct.unit,
          stock: updatedProduct.stock,
          price: updatedProduct.price,
          image: updatedProduct.image,
          active: updatedProduct.stock > 0,
          status: updatedProduct.status || "ACTIVE",
        };

        onSave?.(mappedProd);
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Failed to update product:", errData);
      }
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(30,30,30,0.92)' }}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8 relative">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Product</h2>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="flex flex-col gap-2 pb-6 border-b border-border">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Product Image
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 min-h-[160px] ${isDragging
                ? "border-primary bg-primary/5 scale-[0.99]"
                : imagePreview
                  ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                  : "border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative group/img flex flex-col items-center">
                  <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-border shadow-md transition-transform duration-300 group-hover/img:scale-105 flex items-center justify-center bg-slate-50">
                    {typeof imagePreview === "string" && (imagePreview.startsWith("http") || imagePreview.startsWith("blob")) ? (
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl">{imagePreview || product.emoji || "🥦"}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="p-1.5 rounded-lg bg-white/95 text-slate-800 hover:bg-white transition-colors"
                        title="Change Image"
                      >
                        <UploadCloud size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-600 transition-colors"
                        title="Remove Image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">Click or drag to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <UploadCloud size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Drag and drop image here, or <span className="text-primary hover:underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports JPG, PNG or WEBP (Max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fuji Apples"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none cursor-pointer text-slate-900 dark:text-white"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div >

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product (e.g. fresh, sweet, organic...)"
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stock Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g. 150"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none cursor-pointer text-slate-900 dark:text-white"
              >
                {unitsList.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Original Price</label>
              <input
                type="number"
                value={bPrice}
                onChange={(e) => setBPrice(e.target.value)}
                placeholder="Enter Buying price"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price (Rs.) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={sPrice}
                onChange={(e) => setSPrice(e.target.value)}
                placeholder="Enter Selling price"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-accent cursor-pointer text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 cursor-pointer"
            >
              Confirm Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isSuperAdmin = pathname.startsWith("/superadmin");
  const prefix = isSuperAdmin ? "/superadmin" : "/admin";
  const [searchParams, setSearchParams] = useSearchParams();
  const productIdParam = searchParams.get("productId");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All categories");

  // Keep a local copy of the product list to allow deletion simulation
  const [productList, setProductList] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastKey((prev) => prev + 1);
  };

  const [dbCategories, setDbCategories] = useState([]);
  const [dropdownProductId, setDropdownProductId] = useState(null);

  const closeEditModal = () => {
    setEditingProduct(null);
    if (searchParams.has("productId")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("productId");
      setSearchParams(newParams);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/categories/list`);
        if (res.ok) {
          const data = await res.json();
          setDbCategories(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/list`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((p: any) => ({
            id: p.id,
            sku: `SKU-${p.id.slice(0, 4).toUpperCase()}`,
            name: p.name,
            description: p.description || "",
            category: p.category?.name || "Uncategorized",
            unit: p.unit || "1 kg",
            stock: p.stock || 0,
            price: p.price,
            originalPrice: p.originalPrice || 0,
            image: p.image,
            active: p.stock > 0,
            status: p.status || "ACTIVE",
          }));
          setProductList(mapped);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (productIdParam && productList.length > 0) {
      const found = productList.find((p: any) => p.id === productIdParam);
      if (found) {
        setEditingProduct(found);
      }
    }
  }, [productIdParam, productList]);

  const cats = useMemo(() => ["All categories", ...dbCategories.map((c) => c.name)], [dbCategories]);

  const list = useMemo(() => {
    return productList.filter(
      (p) => (cat === "All categories" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()),
    );
  }, [productList, cat, q]);

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    const id = deletingProduct.id;
    setIsDeleting(true);

    try {
      if (id.startsWith("p-")) {
        setProductList((current) => current.filter((p) => p.id !== id));
        showToast("Product deleted");
        setDeletingProduct(null);
        return;
      }

      const session = getSession();
      const token = session?.token;
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/products/delete/${id}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setProductList((current) => current.filter((p) => p.id !== id));
        showToast("Product deleted");
        setDeletingProduct(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || "Failed to delete product", "error");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      showToast("An error occurred while deleting the product", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateProduct = (updatedProduct) => {
    const updated = productList.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProductList(updated);
    setEditingProduct(null);
    showToast("Product updated");
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const session = getSession();
      const token = session?.token;
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (id.startsWith("p-")) {
        setProductList((current) =>
          current.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
        showToast("Product status updated");
        return;
      }

      const formData = new FormData();
      formData.append("status", newStatus);

      const res = await fetch(`${API_BASE}/api/products/update/${id}`, {
        method: "PUT",
        headers,
        body: formData,
      });

      if (res.ok) {
        setProductList((current) =>
          current.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
        showToast("Product status updated");
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || "Failed to update product status", "error");
      }
    } catch (err) {
      console.error("Error updating product status:", err);
      showToast("An error occurred while updating the product status", "error");
    }
  };

  return (
    <div>
      {toastKey > 0 && <UpdateToast key={toastKey} message={toastMessage} type={toastType} />}
      {/* Delete Product Confirmation Modal */}
      {deletingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
          onClick={() => !isDeleting && setDeletingProduct(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 mb-4">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Delete Product?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProduct(null)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={closeEditModal}
          onSave={handleUpdateProduct}
          categories={dbCategories}
        />
      )}
      <AddProduct
        isOpen={isAddingProduct}
        onClose={() => setIsAddingProduct(false)}
        categories={dbCategories}
        onSave={(newProd) => {
          setProductList([newProd, ...productList]);
        }}
      />
      <PageHeader title="Products" subtitle="Manage store catalog and items" />
      <Card className="!p-0">
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={cat} onChange={(e) => setCat(e.target.value)}
            className="rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none cursor-pointer"
          >
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button
            onClick={() => setIsAddingProduct(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 cursor-pointer"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[15px] text-[#64748b] border-y border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Unit</th>
                <th className="px-4 py-3 text-left font-medium">Stock</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              ) : (
                list.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-xl overflow-hidden">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          p.emoji
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.sku}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3">{p.unit}</td>
                    <td className={`px-4 py-3 ${p.stock === 0 ? "text-rose-600 font-medium" : p.stock < 15 ? "text-amber-600 font-medium" : ""}`}>
                      {p.stock}
                    </td>
                    <td className="px-4 py-3">Rs. {p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() => setDropdownProductId(dropdownProductId === p.id ? null : p.id)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        }`}
                      >
                        {p.status === "ACTIVE" ? "Active" : "Inactive"}
                      </button>
                      {dropdownProductId === p.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setDropdownProductId(null)} />
                          <div className="absolute left-4 top-10 z-20 w-28 rounded-lg bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 py-1 text-xs text-slate-800 dark:text-slate-200">
                            <button
                              onClick={() => {
                                handleStatusChange(p.id, "ACTIVE");
                                setDropdownProductId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-emerald-700 dark:text-emerald-400"
                            >
                              Active
                            </button>
                            <button
                              onClick={() => {
                                handleStatusChange(p.id, "INACTIVE");
                                setDropdownProductId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-rose-700 dark:text-rose-400"
                            >
                              Inactive
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <button className="rounded-md p-1.5 hover:bg-accent hover:text-foreground cursor-pointer"><Eye size={20} /></button>
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="rounded-md p-1.5 hover:bg-accent hover:text-foreground cursor-pointer"
                        >
                          <Pencil size={20} />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(p)}
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-border text-sm">
          <div className="text-muted-foreground">Showing {list.length} of {productList.length} products</div>
          <div className="flex gap-2">
            <button className="rounded-full border border-border px-4 py-1.5 text-muted-foreground hover:bg-accent cursor-pointer">Previous</button>
            <button className="rounded-full border border-border px-4 py-1.5 text-muted-foreground hover:bg-accent cursor-pointer">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}


