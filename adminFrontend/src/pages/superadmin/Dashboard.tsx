// @ts-nocheck
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, Users, UserCheck, ShieldCheck, ShoppingCart, Eye, Pencil, Trash2 } from "lucide-react";
import { Card, PageHeader, categoryRevenue, monthlySales, orders, statusColor, weeklySales, getSession, admins, users } from "../index";
import Navbar from "../../components/Navbar";
import SuperAdminSidebar from "../../components/SuperAdminSidebar";

const RsIcon = () => <span className="text-[11px] font-extrabold leading-none">Rs</span>;

const KPIS = [
  { label: "TOTAL REVENUE", value: "Rs. 1,130.79", delta: "+12.4% MoM", icon: RsIcon, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15" },
  { label: "MONTHLY REVENUE", value: "Rs. 597.75", delta: "+6.1%", icon: TrendingUp, color: "text-sky-600 bg-sky-100 dark:bg-sky-500/15" },
  { label: "TOTAL USERS", value: "1,044", delta: "+0 this month", icon: Users, color: "text-violet-600 bg-violet-100 dark:bg-violet-500/15" },
  { label: "ACTIVE USERS", value: "710", delta: "", icon: UserCheck, color: "text-teal-600 bg-teal-100 dark:bg-teal-500/15" },
  { label: "TOTAL ADMINS", value: "4", delta: "", icon: ShieldCheck, color: "text-amber-600 bg-amber-100 dark:bg-amber-500/15" },
  { label: "TOTAL ORDERS", value: "1,148", delta: "+0 today", icon: ShoppingCart, color: "text-rose-600 bg-rose-100 dark:bg-rose-500/15" },
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

function SuperAdminDashboard({ onSignOut }) {
  const [user, setUser] = useState(null);
  const [range, setRange] = useState("weekly");
  const [dbUsers, setDbUsers] = useState([]);
  const [dbAdmins, setDbAdmins] = useState([]);
  const [dbOrders, setDbOrders] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  const fetchUsers = async () => {
    try {
      const session = getSession();
      const token = session?.token;
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/api/auth/list-users`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDbUsers(data);
        }
      }
    } catch (err) {
      console.error("Error fetching users on superadmin dashboard:", err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const session = getSession();
      const token = session?.token;
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/api/auth/admin/list`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDbAdmins(data);
        }
      }
    } catch (err) {
      console.error("Error fetching admins on superadmin dashboard:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const session = getSession();
      const token = session?.token;
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/api/orders/all-orders`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setDbOrders(data.orders);
        }
      }
    } catch (err) {
      console.error("Error fetching orders on superadmin dashboard:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products/list`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDbProducts(data);
        }
      }
    } catch (err) {
      console.error("Error fetching products on superadmin dashboard:", err);
    }
  };

  useEffect(() => {
    setUser(getSession());
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchAdmins(), fetchOrders(), fetchProducts()]);
      setLoading(false);
    };
    loadData();

    // Poll orders every 5 seconds for real-time graph updates
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate dynamic real-time sales data from database orders for the current week
  const calculateWeeklySales = (ordersList) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const salesMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    (ordersList || []).forEach((o) => {
      if (o.status?.toUpperCase() === 'CANCELLED') return;
      const orderDate = new Date(o.createdAt);
      if (!isNaN(orderDate.getTime()) && orderDate >= startOfWeek && orderDate <= endOfWeek) {
        const dayIdx = (orderDate.getDay() + 6) % 7;
        const dayName = days[dayIdx];
        salesMap[dayName] += Number(o.total) || 0;
      }
    });

    return days.map((d) => ({
      name: d,
      value: Number(salesMap[d].toFixed(2)),
    }));
  };

  const calculateMonthlySales = (ordersList) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesMap = Array(12).fill(0);

    (ordersList || []).forEach((o) => {
      if (o.status?.toUpperCase() === 'CANCELLED') return;
      const orderDate = new Date(o.createdAt);
      if (!isNaN(orderDate.getTime())) {
        const monthIdx = orderDate.getMonth();
        salesMap[monthIdx] += Number(o.total) || 0;
      }
    });

    return months.map((m, idx) => ({
      name: m,
      value: Number(salesMap[idx].toFixed(2)),
    }));
  };

  const calculateCategoryRevenue = (ordersList, productsList) => {
    const parsePrice = (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (typeof val === 'string') {
        const cleaned = val.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
      }
      return 0;
    };

    const prodCatMap = {};
    (productsList || []).forEach((p) => {
      const catName = typeof p.category === 'object' ? p.category?.name : p.category;
      if (catName) {
        if (p.id) prodCatMap[p.id] = catName;
        if (p.name) prodCatMap[p.name.trim().toLowerCase()] = catName;
      }
    });

    const categoryMap = {};

    (ordersList || []).forEach((o) => {
      if (o.status?.toUpperCase() === 'CANCELLED') return;

      let items = o.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }

      if (Array.isArray(items) && items.length > 0) {
        items.forEach((item) => {
          let cat = item.category;
          if (typeof cat === 'object' && cat !== null) {
            cat = cat.name;
          }
          if (!cat) {
            cat = prodCatMap[item.id] || prodCatMap[item.productId] || (item.name ? prodCatMap[item.name.trim().toLowerCase()] : null);
          }
          if (!cat) {
            const nameLower = (item.name || '').toLowerCase();
            if (nameLower.includes('milk') || nameLower.includes('yoghurt') || nameLower.includes('butter') || nameLower.includes('cheese') || nameLower.includes('dairy')) cat = 'Dairy';
            else if (nameLower.includes('rice') || nameLower.includes('sugar') || nameLower.includes('flour') || nameLower.includes('staple')) cat = 'Staples';
            else if (nameLower.includes('chicken') || nameLower.includes('meat') || nameLower.includes('beef') || nameLower.includes('fish') || nameLower.includes('egg')) cat = 'Meat';
            else if (nameLower.includes('cola') || nameLower.includes('pepsi') || nameLower.includes('water') || nameLower.includes('tea') || nameLower.includes('coffee') || nameLower.includes('beverage') || nameLower.includes('drink')) cat = 'Beverages';
            else if (nameLower.includes('apple') || nameLower.includes('banana') || nameLower.includes('fruit') || nameLower.includes('mango')) cat = 'Fruits';
            else if (nameLower.includes('potato') || nameLower.includes('onion') || nameLower.includes('tomato') || nameLower.includes('vegetable')) cat = 'Vegetables';
            else if (nameLower.includes('soap') || nameLower.includes('detergent') || nameLower.includes('cleaner')) cat = 'Household';
            else if (nameLower.includes('biscuit') || nameLower.includes('cracker') || nameLower.includes('bread') || nameLower.includes('cake') || nameLower.includes('chocolate')) cat = 'Bakery';
            else cat = 'Other';
          }

          const qty = Number(item.quantity) || 1;
          const price = parsePrice(item.price);
          const itemTotal = price > 0 ? qty * price : parsePrice(item.total);

          if (itemTotal > 0) {
            categoryMap[cat] = (categoryMap[cat] || 0) + itemTotal;
          }
        });
      }
    });

    const totalRev = Object.values(categoryMap).reduce((sum, v) => sum + (Number(v) || 0), 0);

    const result = Object.keys(categoryMap)
      .map((catName) => ({
        name: catName,
        value: totalRev > 0 ? Number(((categoryMap[catName] / totalRev) * 100).toFixed(2)) : 0,
        amount: Number(categoryMap[catName].toFixed(2)),
      }))
      .filter((c) => c.value > 0);

    if (result.length === 0) {
      return [
        { name: 'Fruits', value: 15 },
        { name: 'Vegetables', value: 18 },
        { name: 'Dairy', value: 22 },
        { name: 'Bakery', value: 10 },
        { name: 'Meat', value: 12 },
        { name: 'Beverages', value: 8 },
        { name: 'Staples', value: 10 },
        { name: 'Household', value: 5 },
      ];
    }

    return result;
  };

  const dynamicWeeklySales = calculateWeeklySales(dbOrders);
  const dynamicMonthlySales = calculateMonthlySales(dbOrders);
  const chartData = range === "weekly" ? dynamicWeeklySales : dynamicMonthlySales;
  const dynamicCategoryRevenue = calculateCategoryRevenue(dbOrders, dbProducts);

  // Real recent orders mapping
  const recent = dbOrders.slice(0, 8).map((order) => {
    return {
      id: order.id,
      customer: order.shippingAddress?.fullName || 'Guest Customer',
      payment: order.paymentMethod === 'cod' ? 'Cash' : 'Card',
      amount: order.total,
      status: order.status,
      date: new Date(order.createdAt).toISOString().slice(0, 10),
    };
  });

  const totalRevenue = dbOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // monthly revenue in the last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
  const monthlyRevenue = dbOrders
    .filter(o => new Date(o.createdAt) >= thirtyDaysAgo)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Calculate users joined this month
  const today = new Date();
  const yearStr = today.getFullYear().toString();
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const thisMonthPrefix = `${yearStr}-${monthStr}`; // e.g. "2026-06"
  const usersThisMonth = dbUsers.filter(u => {
    const dateStr = u.createdAt || u.joined;
    return dateStr && dateStr.startsWith(thisMonthPrefix);
  }).length;

  // Calculate orders made today
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const ordersToday = dbOrders.filter(o => new Date(o.createdAt) >= todayMidnight).length;

  const dynamicKPIS = [
    { label: "TOTAL REVENUE", value: loading ? "..." : `Rs. ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, delta: "+12.4% MoM", icon: RsIcon, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15" },
    { label: "MONTHLY REVENUE", value: loading ? "..." : `Rs. ${monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, delta: "+6.1%", icon: TrendingUp, color: "text-sky-600 bg-sky-100 dark:bg-sky-500/15" },
    { label: "TOTAL USERS", value: loading ? "..." : dbUsers.length.toLocaleString(), delta: loading ? "..." : `+${usersThisMonth} this month`, icon: Users, color: "text-violet-600 bg-violet-100 dark:bg-violet-500/15" },
    { label: "ACTIVE USERS", value: loading ? "..." : dbUsers.filter(u => u.status === "Active").length.toLocaleString(), delta: "", icon: UserCheck, color: "text-teal-600 bg-teal-100 dark:bg-teal-500/15" },
    { label: "TOTAL ADMINS", value: loading ? "..." : dbAdmins.length.toLocaleString(), delta: "", icon: ShieldCheck, color: "text-amber-600 bg-amber-100 dark:bg-amber-500/15" },
    { label: "TOTAL ORDERS", value: loading ? "..." : dbOrders.length.toLocaleString(), delta: loading ? "..." : `+${ordersToday} today`, icon: ShoppingCart, color: "text-rose-600 bg-rose-100 dark:bg-rose-500/15" },
  ];

  return (
    <>
      {user && <WelcomeToast name={user.name?.split(" ")[0] || "Ariana"} />}
      <div className="flex-1 overflow-auto p-6 md:p-8">
          <PageHeader
            title="Overview"
            subtitle={
              <>
                Welcome back, <span className="font-semibold text-foreground">{user?.name?.split(" ")[0] || "Super Admin"}</span>. Platform analytics and management overview.
              </>
            }
          />

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {dynamicKPIS.map((k) => (
              <Card key={k.label} className="!p-5">
                <div className="flex items-start justify-between">
                  <div className="text-[10px] font-semibold tracking-widest text-muted-foreground">{k.label}</div>
                  <div className={`grid h-9 w-9 place-items-center rounded-full ${k.color}`}>
                    <k.icon size={16} />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold">{k.value}</div>
                {k.delta && <div className="mt-1 text-xs text-emerald-600 font-medium">{k.delta}</div>}
              </Card>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">Platform Sales Overview</h3>
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
                  <AreaChart data={chartData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#15803d" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#15803d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.008 240)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} />
                    <Area type="monotone" dataKey="value" stroke="#15803d" strokeWidth={2.5} fill="url(#sales)" />
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
                    <Pie data={dynamicCategoryRevenue} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {dynamicCategoryRevenue.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `${Number(val).toFixed(2)}%`} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} />
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
                <p className="text-sm text-slate-400 mt-0.5">Latest 8 orders received across all stores</p>
              </div>
              <Link to="/superadmin/orders" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition">
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
                      <td className="px-6 py-4 font-bold text-[#111827]" title={o.id}>
                        {o.id.length > 12 ? `${o.id.slice(0, 8).toUpperCase()}...` : o.id}
                      </td>
                      <td className="px-6 py-4 text-[#111827] font-medium">{o.customer}</td>
                      <td className="px-6 py-4 text-[#111827] font-medium">{o.payment}</td>
                      <td className="px-6 py-4 text-[#111827] font-semibold">Rs. {o.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(o.status)}`}>{o.status}</span>
                      </td>
                      <td className="px-6 py-4 text-[#374151] font-medium">{o.date}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Link to="/superadmin/orders" className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer" title="View order">
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

export default SuperAdminDashboard;

