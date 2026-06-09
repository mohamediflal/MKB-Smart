// @ts-nocheck
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Package, CheckCircle2, AlertTriangle, ShoppingCart, Clock, PackageCheck, Eye, Pencil, Trash2 } from "lucide-react";
import { Card, PageHeader, categoryRevenue, monthlySales, orders, statusColor, weeklySales, getSession, products } from "../index";

const KPIS = [
  { label: "TOTAL PRODUCTS", value: "20", icon: Package, color: "text-emerald-700 bg-emerald-50/80" },
  { label: "ACTIVE PRODUCTS", value: "17", icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50/80" },
  { label: "LOW STOCK", value: "6", icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
  { label: "TOTAL ORDERS", value: "28", icon: ShoppingCart, color: "text-sky-600 bg-sky-50" },
  { label: "PENDING", value: "6", icon: Clock, color: "text-rose-600 bg-rose-50" },
  { label: "COMPLETED", value: "5", icon: PackageCheck, color: "text-purple-600 bg-purple-50" },
];

const PIE_COLORS = ["#15803d", "#22c55e", "#84cc16", "#f59e0b", "#3b82f6", "#ec4899"];

function WelcomeToast({ name }) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    // Slide in
    const inTimer = setTimeout(() => setShow(true), 100);
    // Slide out
    const outTimer = setTimeout(() => setShow(false), 3500);
    // Unmount after slide-out finishes
    const unmountTimer = setTimeout(() => setMounted(false), 4000);
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
      <p className="text-[15px] font-medium text-[#065f46]">Welcome back, {name}!</p>
    </div>
  );
}

function AdminDashboard({ onSignOut }) {
  const [user, setUser] = useState(null);
  const [range, setRange] = useState("weekly");

  useEffect(() => {
    setUser(getSession());
  }, []);

  const data = range === "weekly" ? weeklySales : monthlySales;
  const recent = orders.slice(0, 8);

    const dynamicKPIS = [
      { label: "TOTAL PRODUCTS", value: (20 + products.length).toLocaleString(), icon: Package, color: "text-emerald-700 bg-emerald-50/80" },
      { label: "ACTIVE PRODUCTS", value: (15 + products.filter(p => p.active).length).toLocaleString(), icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50/80" },
      { label: "LOW STOCK", value: (3 + products.filter(p => p.stock > 0 && p.stock < 1000).length).toLocaleString(), icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
      { label: "TOTAL ORDERS", value: (20 + orders.length).toLocaleString(), icon: ShoppingCart, color: "text-sky-600 bg-sky-50" },
      { label: "PENDING", value: (2 + orders.filter(o => o.status === "Pending" || o.status === "Processing").length).toLocaleString(), icon: Clock, color: "text-rose-600 bg-rose-50" },
      { label: "COMPLETED", value: (15 + orders.filter(o => o.status === "Delivered" || o.status === "Shipped").length).toLocaleString(), icon: PackageCheck, color: "text-purple-600 bg-purple-50" },
    ];

    return (
      <>
        {user && <WelcomeToast name={user.name?.split(" ")[0] || "Alex"} />}
        <div className="flex-1 overflow-auto p-6 md:p-8">
            <PageHeader
              title="Overview"
              subtitle={
                <>
                  Welcome back, <span className="font-semibold text-foreground">{user?.name?.split(" ")[0] || "Admin"}</span>. Here's what's happening today.
                </>
              }
            />
  
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {dynamicKPIS.map((k) => (
                <Card key={k.label} className="!p-5 rounded-2xl border-slate-100/80 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="text-[11px] font-semibold tracking-wide text-slate-500 leading-tight w-[70px] uppercase">
                      {k.label}
                    </div>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${k.color}`}>
                      <k.icon size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="mt-4 text-[26px] font-bold text-slate-800">{k.value}</div>
                </Card>
              ))}
            </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">Sales Overview</h3>
                  <p className="text-xs text-muted-foreground">Revenue across selected period</p>
                </div>
                <div className="rounded-full bg-muted p-1 text-xs flex gap-1">
                  {["weekly", "monthly"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`rounded-full px-3 py-1 font-medium capitalize transition-all ${range === r ? "bg-white dark:bg-slate-800 shadow-sm text-foreground" : "text-muted-foreground"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)" }} />
                    <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#sales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold">Revenue by Category</h3>
              <p className="text-xs text-muted-foreground">Breakdown of category contribution</p>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryRevenue} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {categoryRevenue.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="mt-6 !p-0">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <h3 className="text-base font-bold text-slate-800">Recent Orders</h3>
                <p className="text-sm text-slate-400 mt-0.5">Latest 8 orders received</p>
              </div>
              <Link to="/admin/orders" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[15px] text-[#64748b] border-y border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 text-left font-semibold tracking-wide">Order ID</th>
                    <th className="px-6 py-3.5 text-left font-semibold tracking-wide">Customer</th>
                    <th className="px-6 py-3.5 text-left font-semibold tracking-wide">Payment</th>
                    <th className="px-6 py-3.5 text-left font-semibold tracking-wide">Total</th>
                    <th className="px-6 py-3.5 text-left font-semibold tracking-wide">Status</th>
                    <th className="px-6 py-3.5 text-left font-semibold tracking-wide">Date</th>
                    <th className="px-6 py-3.5 text-center font-semibold tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#111827]">{o.id}</td>
                      <td className="px-6 py-4 text-[#111827] font-medium">{o.customer}</td>
                      <td className="px-6 py-4 text-[#111827] font-medium">{o.payment}</td>
                      <td className="px-6 py-4 text-[#111827] font-semibold">Rs. {o.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(o.status)}`}>{o.status}</span>
                      </td>
                      <td className="px-6 py-4 text-[#374151] font-medium">{o.date}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Link to="/admin/orders" className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer" title="View order">
                            <Eye size={20} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
      </div>
    </>
  );
}

export default AdminDashboard;

