// @ts-nocheck
import { useState, useEffect } from "react";
import { AlertTriangle, Package, XCircle, History, Plus, Minus, Search } from "lucide-react";
import { Card, PageHeader, getSession } from "../index";

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default function Inventory() {
  const [stockItems, setStockItems] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All categories");
  const [statusFilter, setStatusFilter] = useState("All");

  const categories = ["All categories", ...dbCategories.map((c) => c.name)];

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
        setLoading(true);
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
            emoji: p.category?.name === "Fruits" ? "🍎" : p.category?.name === "Vegetables" ? "🥦" : "📦"
          }));
          setStockItems(mapped);
        }
      } catch (err) {
        console.error("Error fetching products in inventory:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchProducts();
  }, []);

  const totalStockItems = stockItems.reduce((sum, p) => sum + p.stock, 0);
  const inStock = stockItems.filter((p) => p.stock >= 15);
  const lowStock = stockItems.filter((p) => p.stock > 0 && p.stock < 15);
  const outOfStock = stockItems.filter((p) => p.stock === 0);

  const filteredItems = stockItems.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(q.toLowerCase());
    const matchesCategory = cat === "All categories" || p.category === cat;

    let matchesStatus = true;
    if (statusFilter === "In Stock") matchesStatus = p.stock >= 15;
    else if (statusFilter === "Low Stock") matchesStatus = p.stock > 0 && p.stock < 15;
    else if (statusFilter === "Out Of Stock") matchesStatus = p.stock === 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAdjust = async (id, amount) => {
    const item = stockItems.find(p => p.id === id);
    if (!item) return;

    const newStock = Math.max(0, item.stock + amount);

    // Optimistic local state update
    setStockItems(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));

    try {
      const session = getSession();
      const token = session?.token;
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Since updateProduct uses multer upload.single('image'), we should submit via FormData
      const formData = new FormData();
      formData.append("stock", String(newStock));

      const res = await fetch(`${API_BASE}/api/products/update/${id}`, {
        method: "PUT",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Failed to adjust stock on database");
        // Revert optimistic update
        setStockItems(prev => prev.map(p => p.id === id ? { ...p, stock: item.stock } : p));
      }
    } catch (err) {
      console.error("Error adjusting stock:", err);
      // Revert optimistic update
      setStockItems(prev => prev.map(p => p.id === id ? { ...p, stock: item.stock } : p));
    }
  };

  const inventoryHistory = [
    { id: 1, product: "Organic Bananas", change: -1, reason: "Manual deduction", date: "2026-06-03 16:53" },
    { id: 2, product: "Whole Milk 1L", change: 50, reason: "Restock", date: "2026-05-26 10:12" },
    { id: 3, product: "Sourdough Loaf", change: -3, reason: "Damaged", date: "2026-05-25 16:45" },
    { id: 4, product: "Free-Range Eggs", change: 120, reason: "Restock", date: "2026-05-24 09:00" },
  ];

  const getCategoryColor = (cat) => {
    const colors = {
      Fruits: "bg-emerald-50 text-emerald-600",
      Vegetables: "bg-emerald-50 text-emerald-600",
      Dairy: "bg-sky-50 text-sky-600",
      Bakery: "bg-amber-50 text-amber-600",
      Meat: "bg-rose-50 text-rose-600",
      Beverages: "bg-indigo-50 text-indigo-600",
      Snacks: "bg-amber-50 text-amber-600",
      Frozen: "bg-cyan-50 text-cyan-600",
      Staples: "bg-emerald-50 text-emerald-600",
      Household: "bg-purple-50 text-purple-600",
    };
    return colors[cat] || "bg-slate-50 text-slate-600";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Inventory" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[24px]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Total Stock Items</div>
              <div className="text-3xl font-bold text-slate-900">{loading ? "..." : totalStockItems}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Package size={24} />
            </div>
          </div>
        </Card>

        <Card className="rounded-[24px]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">In Stock</div>
              <div className="text-3xl font-bold text-slate-900">{loading ? "..." : inStock.length}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Package size={24} />
            </div>
          </div>
        </Card>

        <Card className="rounded-[24px]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Low Stock</div>
              <div className="text-3xl font-bold text-slate-900">{loading ? "..." : lowStock.length}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle size={24} />
            </div>
          </div>
        </Card>

        <Card className="rounded-[24px]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Out Of Stock</div>
              <div className="text-3xl font-bold text-slate-900">{loading ? "..." : outOfStock.length}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle size={24} />
            </div>
          </div>
        </Card>
      </div>

      <Card className="!p-0 rounded-[24px] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900">Current Stock</h3>
          <p className="text-sm text-slate-500 pr-12">Adjust quantities directly</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b border-slate-100 bg-white">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none cursor-pointer focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700"
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none cursor-pointer focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700"
            >
              <option value="All">All statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out Of Stock">Out Of Stock</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <p className="mt-3 text-slate-500 text-sm font-semibold">Loading stock data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white">
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-6 py-4 text-left font-medium">Product</th>
                  <th className="px-6 py-4 text-left font-medium">Category</th>
                  <th className="px-6 py-4 text-left font-medium">Stock</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-center font-medium">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No products found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((p) => (
                    <tr key={p.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-lg">{p.emoji || "🥦"}</span>
                            )}
                          </div>
                          <span className="font-semibold text-slate-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-900">{p.category}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{p.stock} {p.unit}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                          ${p.stock === 0
                            ? "bg-rose-50 text-rose-600"
                            : p.stock < 15
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {p.stock === 0 ? "Out Of Stock" : p.stock < 15 ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAdjust(p.id, -1)}
                            className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={p.stock}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                handleAdjust(p.id, val - p.stock);
                              }
                            }}
                            className="h-8 w-16 rounded-full border border-slate-200 text-center font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => handleAdjust(p.id, 1)}
                            className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="!p-0 rounded-[24px] overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <History className="text-slate-400" size={20} />
            <h3>Inventory History</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white">
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="px-6 py-4 text-left font-medium">Product</th>
                <th className="px-6 py-4 text-left font-medium">Change</th>
                <th className="px-6 py-4 text-left font-medium">Reason</th>
                <th className="px-6 py-4 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventoryHistory.map((h) => (
                <tr key={h.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{h.product}</td>
                  <td className={`px-6 py-4 font-semibold ${h.change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {h.change > 0 ? '+' : ''}{h.change}
                  </td>
                  <td className="px-6 py-4 text-slate-900">{h.reason}</td>
                  <td className="px-6 py-4 text-slate-900">{h.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
