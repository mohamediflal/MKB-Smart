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
  { label: "TOTAL USERS", value: "1,044", delta: "+38 today", icon: Users, color: "text-violet-600 bg-violet-100 dark:bg-violet-500/15" },
  { label: "ACTIVE USERS", value: "710", delta: "", icon: UserCheck, color: "text-teal-600 bg-teal-100 dark:bg-teal-500/15" },
  { label: "TOTAL ADMINS", value: "4", delta: "", icon: ShieldCheck, color: "text-amber-600 bg-amber-100 dark:bg-amber-500/15" },
  { label: "TOTAL ORDERS", value: "1,148", delta: "+24 today", icon: ShoppingCart, color: "text-rose-600 bg-rose-100 dark:bg-rose-500/15" },
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

  useEffect(() => {
    setUser(getSession());
  }, []);

  const data = range === "weekly" ? weeklySales : monthlySales;
  const recent = orders.slice(0, 8);

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0) * 150 + 2385000;
  const monthlyRevenue = orders.slice(0, 15).reduce((sum, o) => sum + o.amount, 0) * 120 + 1986000;
  const totalUsersCount = users.length * 2 + 120;
  const activeUsersCount = users.filter(u => u.status === "Active").length * 2 + 80;
  const totalAdminsCount = admins.length;
  const totalOrdersCount = orders.length * 3 + 200;

  const dynamicKPIS = [
    { label: "TOTAL REVENUE", value: `Rs. ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, delta: "+12.4% MoM", icon: RsIcon, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15" },
    { label: "MONTHLY REVENUE", value: `Rs. ${monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, delta: "+6.1%", icon: TrendingUp, color: "text-sky-600 bg-sky-100 dark:bg-sky-500/15" },
    { label: "TOTAL USERS", value: totalUsersCount.toLocaleString(), delta: "+38 today", icon: Users, color: "text-violet-600 bg-violet-100 dark:bg-violet-500/15" },
    { label: "ACTIVE USERS", value: activeUsersCount.toLocaleString(), delta: "", icon: UserCheck, color: "text-teal-600 bg-teal-100 dark:bg-teal-500/15" },
    { label: "TOTAL ADMINS", value: totalAdminsCount.toLocaleString(), delta: "", icon: ShieldCheck, color: "text-amber-600 bg-amber-100 dark:bg-amber-500/15" },
    { label: "TOTAL ORDERS", value: totalOrdersCount.toLocaleString(), delta: "+24 today", icon: ShoppingCart, color: "text-rose-600 bg-rose-100 dark:bg-rose-500/15" },
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
                  <AreaChart data={data} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
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

