// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, PageHeader, addProduct, categories } from "../index";

export default function AddProduct() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Fruits");
  const [unit, setUnit] = useState("kg");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [emoji, setEmoji] = useState("🍏");

  const categoriesList = categories.map(c => c.name);
  const unitsList = ["kg", "g", "L", "ml", "pcs"];
  const emojisList = ["🥦", "🍅", "🥕", "🍎", "🍌", "🍞", "🧀", "🥛", "🥚", "🍓", "🥬", "🍇", "🍏", "🍊", "🍋", "🍍", "🥑", "🥩", "🍗", "🥪"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !stock || !price) {
      alert("Please fill in all required fields.");
      return;
    }
    addProduct({
      name,
      sku: sku || undefined,
      category,
      unit,
      stock: parseInt(stock, 10),
      price: parseFloat(price),
      emoji,
      active: true,
    });
    alert("Product added successfully!");
    navigate("/admin/products");
  };

  return (
    <div>
      <PageHeader
        title="Add Product"
        subtitle="Create a new listing in the store catalog"
        actions={
          <button
            onClick={() => navigate("/admin/products")}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Products
          </button>
        }
      />
      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-3 pb-6 border-b border-border">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10 text-4xl border border-primary/20 shadow-inner">
              {emoji}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-2">Select Emoji / Icon</label>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {emojisList.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={`h-9 w-9 text-xl rounded-xl transition hover:scale-110 active:scale-95 ${emoji === em ? "bg-primary/25 border-2 border-primary scale-110" : "bg-muted border border-border"}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fuji Apples"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">SKU (optional)</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SKU-5002"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none cursor-pointer"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none cursor-pointer"
              >
                {unitsList.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Stock Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g. 150"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price (Rs.) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 4.99"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-accent cursor-pointer"
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
      </Card>
    </div>
  );
}

