import { useState, useRef, useEffect } from "react";
import { X, UploadCloud, Trash2, Image } from "lucide-react";
import { getSession } from "../index";

export default function AddProduct({ isOpen, onClose, onSave, categories: propCategories }) {
  const [name, setName] = useState("");
  const [bPrice, setBPrice] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("1 kg");
  const [stock, setStock] = useState("");
  const [sPrice, setSPrice] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [description, setDescription] = useState("");

  const fileInputRef = useRef(null);

  const activeCategories = propCategories || [];
  const categoriesList = activeCategories.map(c => c.name);
  const unitsList = ["1 kg", "1 pack", "1 L", "1 pcs"];

  useEffect(() => {
    if (categoriesList.length > 0) {
      setCategory(prev => prev || categoriesList[0]);
    }
  }, [categoriesList]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !stock || !sPrice) {
      alert("Please fill in all required fields.");
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert("Product image is required.");
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
      formData.append("image", file);

      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const res = await fetch(`${base}/api/products/add`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        alert("Product added successfully!");

        const addedProduct = data.product;
        const mappedProd = {
          id: addedProduct.id,
          sku: `SKU-${addedProduct.id.slice(0, 4).toUpperCase()}`,
          name: addedProduct.name,
          description: addedProduct.description,
          category: addedProduct.category?.name || category,
          unit: addedProduct.unit,
          stock: addedProduct.stock,
          price: addedProduct.price,
          image: addedProduct.image,
          active: true,
          status: addedProduct.status || "ACTIVE",
        };

        onSave?.(mappedProd);

        // Reset state
        setName("");
        setDescription("");
        setBPrice("");
        setCategory(categoriesList[0] || "Fruits");
        setUnit("1 kg");
        setStock("");
        setSPrice("");
        setImagePreview("");
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Failed to add product");
      }
    } catch (err) {
      console.error("Error saving product:", err);
      alert("An error occurred while saving the product.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(30,30,30,0.92)' }}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8 relative">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add Product</h2>
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
                  <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-border shadow-md transition-transform duration-300 group-hover/img:scale-105">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
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
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
