// @ts-nocheck
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Trash2, X, Upload } from "lucide-react";
import { Card, PageHeader, products, categories } from "../index";

function UpdateToast({ message }) {
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

  return (
    <div
      style={{
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
        transform: show ? 'translateX(0)' : 'translateX(120%)',
        opacity: show ? 1 : 0,
      }}
      className="fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-xl bg-[#ebfef5] px-[18px] py-3.5 shadow-md border border-emerald-100"
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#10b981]">
        <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-[15px] font-medium text-[#065f46]">{message}</p>
    </div>
  );
}

function EditProductModal({ product, onClose, onSave }) {
  const [name, setName] = useState(product.name || "");
  const [desc, setDesc] = useState(product.description || "");
  const [category, setCategory] = useState(product.category || "Fruits");
  const [unit, setUnit] = useState(product.unit || "kg");
  const [price, setPrice] = useState(product.price || "");
  const [discount, setDiscount] = useState(product.discount || "");
  const [stock, setStock] = useState(product.stock || "");
  const [sku, setSku] = useState(product.sku || "");
  const [status, setStatus] = useState(product.active ? "Active" : "Inactive");

  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...product,
      name,
      description: desc,
      category,
      unit,
      price: parseFloat(price),
      discount,
      stock: parseInt(stock, 10),
      sku,
      active: status === "Active",
      image: imagePreview || product.image,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{backgroundColor: 'rgba(30,30,30,0.92)'}}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8 relative">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Product</h2>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2">Product image</label>
            <div className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-300 p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-2xl border border-primary/20 overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    product.emoji || "🥦"
                  )
                )}
              </div>
              <div>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 cursor-pointer">
                  <Upload size={16} /> Upload image
                </button>
                <p className="mt-1 text-xs text-slate-500">PNG or JPG, max 2MB</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Product name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Description</label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short product description..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none bg-white cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none bg-white cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option>kg</option>
                <option>g</option>
                <option>L</option>
                <option>ml</option>
                <option>pcs</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Price</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Discount (%)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Stock quantity</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none bg-white cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-colors cursor-pointer"
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
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All categories");

  // Keep a local copy of the product list to allow deletion simulation
  const [productList, setProductList] = useState(products);
  const [editingProduct, setEditingProduct] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const cats = useMemo(() => ["All categories", ...categories.map((c) => c.name)], [productList]);

  const list = useMemo(() => {
    return productList.filter(
      (p) => (cat === "All categories" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()),
    );
  }, [productList, cat, q]);

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const updated = productList.filter((p) => p.id !== id);
      setProductList(updated);
      // Update global store
      const idx = products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        products.splice(idx, 1);
        if (typeof window !== "undefined") {
          localStorage.setItem("grocery_products_mkb_v3", JSON.stringify(products));
        }
      }
    }
  };

  const handleUpdateProduct = (updatedProduct) => {
    const updated = productList.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProductList(updated);
    // Update global store
    const idx = products.findIndex((p) => p.id === updatedProduct.id);
    if (idx !== -1) {
      products[idx] = updatedProduct;
      if (typeof window !== "undefined") {
        localStorage.setItem("grocery_products_mkb_v3", JSON.stringify(products));
      }
    }
    setEditingProduct(null);
    setToastKey(prev => prev + 1);
  };

  return (
    <div>
      {toastKey > 0 && <UpdateToast key={toastKey} message="Product updated" />}
      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSave={handleUpdateProduct} 
        />
      )}
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
            onClick={() => navigate("/admin/add-product")}
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
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                        {p.active ? "Active" : "Inactive"}
                      </span>
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
                          onClick={() => handleDelete(p.id)}
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 cursor-pointer"
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


