// @ts-nocheck
import { useState, useEffect } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { Calendar, ChevronDown, Download, FileText, Check } from "lucide-react";
import { Card, getSession } from "../index";
import { jsPDF } from "jspdf";

// Dynamic data configurations for each range filter
const dataByRange = {
  "Last 7 days": {
    revenue: [
      { name: "Mon", value: 4200000 },
      { name: "Tue", value: 5100000 },
      { name: "Wed", value: 4800000 },
      { name: "Thu", value: 5600000 },
      { name: "Fri", value: 6400000 },
      { name: "Sat", value: 7800000 },
      { name: "Sun", value: 7100000 },
    ],
    orders: [
      { name: "Mon", value: 1200 },
      { name: "Tue", value: 1500 },
      { name: "Wed", value: 1800 },
      { name: "Thu", value: 1600 },
      { name: "Fri", value: 2200 },
      { name: "Sat", value: 2800 },
      { name: "Sun", value: 2400 },
    ],
    categories: [
      { name: "Fruits", value: 20, color: "#15803d" },
      { name: "Vegetables", value: 16, color: "#22c55e" },
      { name: "Dairy", value: 12, color: "#84cc16" },
      { name: "Bakery", value: 10, color: "#f59e0b" },
      { name: "Meat", value: 9, color: "#4f46e5" },
      { name: "Beverages", value: 13, color: "#ec4899" },
      { name: "Staples", value: 12, color: "#ca8a04" },
      { name: "Household", value: 8, color: "#a855f7" },
    ],
    products: [
      { name: "Organic Bananas", sold: 13500, value: 2700000 },
      { name: "Fresh Avocado", sold: 9800, value: 3920000 },
      { name: "Whole Milk 1L", sold: 8200, value: 3280000 },
      { name: "Sourdough Loaf", sold: 6400, value: 3840000 },
      { name: "Free-Range Eggs", sold: 5000, value: 2500000 },
    ],
    yAxisMaxRevenue: 8000000,
    yAxisTicksRevenue: [0, 2000000, 4000000, 6000000, 8000000],
    yAxisMaxOrders: 3000,
    yAxisTicksOrders: [0, 750, 1500, 2250, 3000],
  },
  "Last 30 days": {
    revenue: [
      { name: "Week 1", value: 38200000 },
      { name: "Week 2", value: 44500000 },
      { name: "Week 3", value: 51000000 },
      { name: "Week 4", value: 53500000 },
    ],
    orders: [
      { name: "Week 1", value: 11000 },
      { name: "Week 2", value: 12500 },
      { name: "Week 3", value: 14000 },
      { name: "Week 4", value: 13000 },
    ],
    categories: [
      { name: "Fruits", value: 18, color: "#15803d" },
      { name: "Vegetables", value: 15, color: "#22c55e" },
      { name: "Dairy", value: 10, color: "#84cc16" },
      { name: "Bakery", value: 14, color: "#f59e0b" },
      { name: "Meat", value: 9, color: "#4f46e5" },
      { name: "Beverages", value: 14, color: "#ec4899" },
      { name: "Staples", value: 12, color: "#ca8a04" },
      { name: "Household", value: 8, color: "#a855f7" },
    ],
    products: [
      { name: "Organic Bananas", sold: 58000, value: 11600000 },
      { name: "Fresh Avocado", sold: 42000, value: 16800000 },
      { name: "Whole Milk 1L", sold: 35000, value: 14000000 },
      { name: "Sourdough Loaf", sold: 28000, value: 16800000 },
      { name: "Free-Range Eggs", sold: 22000, value: 11000000 },
    ],
    yAxisMaxRevenue: 60000000,
    yAxisTicksRevenue: [0, 15000000, 30000000, 45000000, 60000000],
    yAxisMaxOrders: 15000,
    yAxisTicksOrders: [0, 3750, 7500, 11250, 15000],
  },
  "Year to date": {
    revenue: [
      { name: "Jan", value: 118000000 },
      { name: "Feb", value: 138000000 },
      { name: "Mar", value: 154000000 },
      { name: "Apr", value: 162000000 },
      { name: "May", value: 175000000 },
      { name: "Jun", value: 171000000 },
    ],
    orders: [
      { name: "Jan", value: 32000 },
      { name: "Feb", value: 33500 },
      { name: "Mar", value: 31200 },
      { name: "Apr", value: 29500 },
      { name: "May", value: 27800 },
      { name: "Jun", value: 26400 },
    ],
    categories: [
      { name: "Fruits", value: 19, color: "#15803d" },
      { name: "Vegetables", value: 16, color: "#22c55e" },
      { name: "Dairy", value: 12, color: "#84cc16" },
      { name: "Bakery", value: 11, color: "#f59e0b" },
      { name: "Meat", value: 9, color: "#4f46e5" },
      { name: "Beverages", value: 13, color: "#ec4899" },
      { name: "Staples", value: 13, color: "#ca8a04" },
      { name: "Household", value: 7, color: "#a855f7" },
    ],
    products: [
      { name: "Organic Bananas", sold: 320000, value: 64000000 },
      { name: "Fresh Avocado", sold: 242000, value: 96800000 },
      { name: "Whole Milk 1L", sold: 215000, value: 86000000 },
      { name: "Sourdough Loaf", sold: 198000, value: 118800000 },
      { name: "Free-Range Eggs", sold: 174000, value: 87000000 },
    ],
    yAxisMaxRevenue: 200000000,
    yAxisTicksRevenue: [0, 50000000, 100000000, 150000000, 200000000],
    yAxisMaxOrders: 40000,
    yAxisTicksOrders: [0, 10000, 20000, 30000, 40000],
  },
  "All time": {
    revenue: [
      { name: "Jan", value: 118000000 },
      { name: "Feb", value: 138000000 },
      { name: "Mar", value: 154000000 },
      { name: "Apr", value: 162000000 },
      { name: "May", value: 175000000 },
      { name: "Jun", value: 171000000 },
      { name: "Jul", value: 165000000 },
      { name: "Aug", value: 152000000 },
      { name: "Sep", value: 146000000 },
      { name: "Oct", value: 141000000 },
      { name: "Nov", value: 148000000 },
      { name: "Dec", value: 168000000 },
    ],
    orders: [
      { name: "Jan", value: 32000 },
      { name: "Feb", value: 33500 },
      { name: "Mar", value: 31200 },
      { name: "Apr", value: 29500 },
      { name: "May", value: 27800 },
      { name: "Jun", value: 26400 },
      { name: "Jul", value: 26400 },
      { name: "Aug", value: 28100 },
      { name: "Sep", value: 31200 },
      { name: "Oct", value: 35800 },
      { name: "Nov", value: 39200 },
      { name: "Dec", value: 43500 },
    ],
    categories: [
      { name: "Fruits", value: 17, color: "#15803d" },
      { name: "Vegetables", value: 14, color: "#22c55e" },
      { name: "Dairy", value: 11, color: "#84cc16" },
      { name: "Bakery", value: 13, color: "#f59e0b" },
      { name: "Meat", value: 10, color: "#4f46e5" },
      { name: "Beverages", value: 15, color: "#ec4899" },
      { name: "Staples", value: 13, color: "#ca8a04" },
      { name: "Household", value: 7, color: "#a855f7" },
    ],
    products: [
      { name: "Organic Bananas", sold: 720000, value: 144000000 },
      { name: "Fresh Avocado", sold: 580000, value: 232000000 },
      { name: "Whole Milk 1L", sold: 490000, value: 196000000 },
      { name: "Sourdough Loaf", sold: 410000, value: 246000000 },
      { name: "Free-Range Eggs", sold: 350000, value: 175000000 },
    ],
    yAxisMaxRevenue: 200000000,
    yAxisTicksRevenue: [0, 50000000, 100000000, 150000000, 200000000],
    yAxisMaxOrders: 50000,
    yAxisTicksOrders: [0, 12500, 25000, 37500, 50000],
  },
};

export default function Revenue() {
  const [selectedRange, setSelectedRange] = useState("All time");
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [dbOrders, setDbOrders] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);

  const ranges = ["Last 7 days", "Last 30 days", "Year to date", "All time"];

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

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
      console.error("Error fetching orders in Revenue page:", err);
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
      console.error("Error fetching products in Revenue page:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();

    // Poll every 5 seconds for real-time revenue updates
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRevenueForRange = (range, orders) => {
    const validOrders = (orders || []).filter(o => o.status?.toUpperCase() !== 'CANCELLED');
    const now = new Date();

    if (range === "Last 7 days") {
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

        let daySum = 0;
        validOrders.forEach(o => {
          const orderDate = new Date(o.createdAt);
          if (!isNaN(orderDate.getTime()) && orderDate >= dayStart && orderDate <= dayEnd) {
            daySum += Number(o.total) || 0;
          }
        });

        result.push({ name: dayName, value: Number(daySum.toFixed(2)) });
      }
      return result;
    }

    if (range === "Last 30 days") {
      const result = [
        { name: "Week 1", value: 0 },
        { name: "Week 2", value: 0 },
        { name: "Week 3", value: 0 },
        { name: "Week 4", value: 0 },
      ];

      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      validOrders.forEach(o => {
        const orderDate = new Date(o.createdAt);
        if (!isNaN(orderDate.getTime()) && orderDate >= thirtyDaysAgo && orderDate <= now) {
          const diffInMs = now.getTime() - orderDate.getTime();
          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          
          if (diffInDays <= 7) {
            result[3].value += Number(o.total) || 0;
          } else if (diffInDays <= 14) {
            result[2].value += Number(o.total) || 0;
          } else if (diffInDays <= 21) {
            result[1].value += Number(o.total) || 0;
          } else if (diffInDays <= 30) {
            result[0].value += Number(o.total) || 0;
          }
        }
      });

      result.forEach(r => r.value = Number(r.value.toFixed(2)));
      return result;
    }

    if (range === "Year to date") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonthIdx = now.getMonth();
      const activeMonths = months.slice(0, currentMonthIdx + 1);
      const salesMap = Array(12).fill(0);
      const currentYear = now.getFullYear();

      validOrders.forEach(o => {
        const orderDate = new Date(o.createdAt);
        if (!isNaN(orderDate.getTime()) && orderDate.getFullYear() === currentYear) {
          salesMap[orderDate.getMonth()] += Number(o.total) || 0;
        }
      });

      return activeMonths.map((m, idx) => ({ name: m, value: Number(salesMap[idx].toFixed(2)) }));
    }

    // Default "All time" (12 months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const salesMap = Array(12).fill(0);
    validOrders.forEach(o => {
      const orderDate = new Date(o.createdAt);
      if (!isNaN(orderDate.getTime())) {
        salesMap[orderDate.getMonth()] += Number(o.total) || 0;
      }
    });
    return months.map((m, idx) => ({ name: m, value: Number(salesMap[idx].toFixed(2)) }));
  };

  const getOrdersForRange = (range, orders) => {
    const validOrders = (orders || []).filter(o => o.status?.toUpperCase() !== 'CANCELLED');
    const now = new Date();

    if (range === "Last 7 days") {
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

        let dayCount = 0;
        validOrders.forEach(o => {
          const orderDate = new Date(o.createdAt);
          if (!isNaN(orderDate.getTime()) && orderDate >= dayStart && orderDate <= dayEnd) {
            dayCount += 1;
          }
        });

        result.push({ name: dayName, value: dayCount });
      }
      return result;
    }

    if (range === "Last 30 days") {
      const result = [
        { name: "Week 1", value: 0 },
        { name: "Week 2", value: 0 },
        { name: "Week 3", value: 0 },
        { name: "Week 4", value: 0 },
      ];

      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      validOrders.forEach(o => {
        const orderDate = new Date(o.createdAt);
        if (!isNaN(orderDate.getTime()) && orderDate >= thirtyDaysAgo && orderDate <= now) {
          const diffInMs = now.getTime() - orderDate.getTime();
          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          
          if (diffInDays <= 7) {
            result[3].value += 1;
          } else if (diffInDays <= 14) {
            result[2].value += 1;
          } else if (diffInDays <= 21) {
            result[1].value += 1;
          } else if (diffInDays <= 30) {
            result[0].value += 1;
          }
        }
      });

      return result;
    }

    if (range === "Year to date") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonthIdx = now.getMonth();
      const activeMonths = months.slice(0, currentMonthIdx + 1);
      const countMap = Array(12).fill(0);
      const currentYear = now.getFullYear();

      validOrders.forEach(o => {
        const orderDate = new Date(o.createdAt);
        if (!isNaN(orderDate.getTime()) && orderDate.getFullYear() === currentYear) {
          countMap[orderDate.getMonth()] += 1;
        }
      });

      return activeMonths.map((m, idx) => ({ name: m, value: countMap[idx] }));
    }

    // Default "All time" (12 months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const countMap = Array(12).fill(0);
    validOrders.forEach(o => {
      const orderDate = new Date(o.createdAt);
      if (!isNaN(orderDate.getTime())) {
        countMap[orderDate.getMonth()] += 1;
      }
    });
    return months.map((m, idx) => ({ name: m, value: countMap[idx] }));
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
    const PIE_COLORS = ["#15803d", "#22c55e", "#84cc16", "#f59e0b", "#3b82f6", "#ec4899", "#ca8a04", "#a855f7"];

    const result = Object.keys(categoryMap)
      .map((catName, idx) => ({
        name: catName,
        value: totalRev > 0 ? Number(((categoryMap[catName] / totalRev) * 100).toFixed(2)) : 0,
        amount: Number(categoryMap[catName].toFixed(2)),
        color: PIE_COLORS[idx % PIE_COLORS.length],
      }))
      .filter((c) => c.value > 0);

    if (result.length === 0) {
      return [
        { name: 'Fruits', value: 15, color: "#15803d" },
        { name: 'Vegetables', value: 18, color: "#22c55e" },
        { name: 'Dairy', value: 22, color: "#84cc16" },
        { name: 'Bakery', value: 10, color: "#f59e0b" },
        { name: 'Meat', value: 12, color: "#3b82f6" },
        { name: 'Beverages', value: 8, color: "#ec4899" },
        { name: 'Staples', value: 10, color: "#ca8a04" },
        { name: 'Household', value: 5, color: "#a855f7" },
      ];
    }

    return result;
  };

  const getTopSellingProducts = (range, orders, productsList) => {
    const parsePrice = (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (typeof val === 'string') {
        const cleaned = val.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
      }
      return 0;
    };

    const prodNameMap = {};
    (productsList || []).forEach((p) => {
      if (p.id && p.name) {
        prodNameMap[p.id] = p.name;
      }
    });

    const now = new Date();
    let startDate = null;

    if (range === "Last 7 days") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "Last 30 days") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "Year to date") {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    }

    const validOrders = (orders || []).filter(o => {
      if (o.status?.toUpperCase() === 'CANCELLED') return false;
      if (startDate) {
        const orderDate = new Date(o.createdAt);
        if (isNaN(orderDate.getTime()) || orderDate < startDate) return false;
      }
      return true;
    });

    const productMap = {};

    validOrders.forEach((o) => {
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
          const name = item.name || prodNameMap[item.id] || prodNameMap[item.productId] || 'Unknown Product';
          const qty = Number(item.quantity) || 1;
          const price = parsePrice(item.price);
          const itemTotal = price > 0 ? qty * price : parsePrice(item.total);

          if (!productMap[name]) {
            productMap[name] = { name, sold: 0, value: 0 };
          }
          productMap[name].sold += qty;
          productMap[name].value += itemTotal;
        });
      }
    });

    const topList = Object.values(productMap)
      .map(p => ({
        name: p.name,
        sold: p.sold,
        value: Number(p.value.toFixed(2))
      }))
      .sort((a, b) => b.sold - a.sold || b.value - a.value)
      .slice(0, 5);

    if (topList.length === 0) {
      return [
        { name: "Organic Bananas", sold: 120, value: 24000.00 },
        { name: "Fresh Avocado", sold: 95, value: 38000.00 },
        { name: "Whole Milk 1L", sold: 80, value: 32000.00 },
        { name: "Sourdough Loaf", sold: 65, value: 39000.00 },
        { name: "Free-Range Eggs", sold: 50, value: 25000.00 },
      ];
    }

    return topList;
  };

  const dynamicRevenueData = getRevenueForRange(selectedRange, dbOrders);
  const dynamicOrdersData = getOrdersForRange(selectedRange, dbOrders);
  const dynamicCategoryRevenue = calculateCategoryRevenue(dbOrders, dbProducts);
  const dynamicTopProducts = getTopSellingProducts(selectedRange, dbOrders, dbProducts);
  const activeData = dataByRange[selectedRange] || dataByRange["All time"];

  // Functional CSV Export
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += `Revenue Analytics Report (${selectedRange})\n`;
    csvContent += "Timeframe,Revenue (LKR),Orders\n";
    activeData.revenue.forEach((rev, idx) => {
      const ord = activeData.orders[idx] || { value: 0 };
      csvContent += `${rev.name},${rev.value},${ord.value}\n`;
    });
    
    csvContent += "\nCategory Revenue Distribution\n";
    csvContent += "Category,Percentage (%)\n";
    dynamicCategoryRevenue.forEach(cat => {
      csvContent += `${cat.name},${cat.value}%\n`;
    });
    
    csvContent += "\nTop Selling Products\n";
    csvContent += "Product Name,Units Sold,Revenue (LKR)\n";
    dynamicTopProducts.forEach(prod => {
      csvContent += `${prod.name},${prod.sold},${prod.value}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Revenue_Analytics_${selectedRange.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Functional PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(21, 128, 61); // Green branding
    doc.text("MKB SMART - REVENUE ANALYTICS REPORT", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Scope: ${selectedRange}`, 14, 26);
    
    // Horizontal Line separator
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 30, 196, 30);
    
    // Stats
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`${selectedRange} Revenue & Orders Overview`, 14, 40);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Timeframe", 14, 48);
    doc.text("Revenue (Rs.)", 60, 48);
    doc.text("Orders Count", 110, 48);
    doc.line(14, 50, 196, 50);
    
    doc.setFont("helvetica", "normal");
    let y = 56;
    activeData.revenue.forEach((rev, idx) => {
      const ord = activeData.orders[idx] || { value: 0 };
      doc.text(rev.name, 14, y);
      doc.text(`Rs. ${rev.value.toLocaleString()}`, 60, y);
      doc.text(ord.value.toString(), 110, y);
      y += 8;
    });

    // Add new page for category breakdown and top selling products
    doc.addPage();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Revenue by Category", 14, 20);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Category", 14, 28);
    doc.text("Revenue Share (%)", 60, 28);
    doc.line(14, 30, 196, 30);
    
    doc.setFont("helvetica", "normal");
    y = 36;
    dynamicCategoryRevenue.forEach(cat => {
      doc.text(cat.name, 14, y);
      doc.text(`${cat.value}%`, 60, y);
      y += 8;
    });
    
    // Top selling products
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Top Selling Products Performance", 14, y);
    
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Product", 14, y);
    doc.text("Units Sold", 80, y);
    doc.text("Total Value (Rs.)", 130, y);
    doc.line(14, y + 2, 196, y + 2);
    
    doc.setFont("helvetica", "normal");
    y += 8;
    dynamicTopProducts.forEach((prod, idx) => {
      doc.text(`${idx + 1}. ${prod.name}`, 14, y);
      doc.text(prod.sold.toString(), 80, y);
      doc.text(`Rs. ${prod.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 130, y);
      y += 8;
    });
    
    doc.save(`Revenue_Report_${selectedRange.replace(/ /g, "_")}.pdf`);
  };

  return (
    <div className="flex-1 overflow-auto p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Revenue Analytics
          </h1>
        </div>
        
        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year to date filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Calendar className="h-4.5 w-4.5 text-slate-500" />
              <span>{selectedRange}</span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
            
            {showRangeDropdown && (
              <>
                {/* Overlay to close the dropdown when clicking outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowRangeDropdown(false)} 
                />
                
                <div className="absolute left-0 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-lg z-50 dark:border-slate-850 dark:bg-slate-900">
                  {ranges.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedRange(r);
                        setShowRangeDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition cursor-pointer font-medium ${
                        selectedRange === r
                          ? "text-slate-900 dark:text-white font-semibold"
                          : "text-slate-600 dark:text-slate-400"
                      } hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/20 dark:hover:text-green-400`}
                    >
                      <span>{r}</span>
                      {selectedRange === r && (
                        <Check className="h-4 w-4 text-slate-800 dark:text-white shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Download className="h-4.5 w-4.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Export PDF button */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileText className="h-4.5 w-4.5 text-slate-500" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Row 1: Monthly Revenue & Order Trends */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Card */}
        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-slate-800">
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Monthly Revenue</h3>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dynamicRevenueData}
                margin={{ left: -10, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                />
                <Tooltip
                  cursor={{ fill: "rgba(21, 128, 61, 0.04)" }}
                  formatter={(value) => [`Rs. ${value.toLocaleString()}`, "Revenue"]}
                  contentStyle={{
                    borderRadius: 12,
                    backgroundColor: "var(--card)",
                    borderColor: "var(--color-border)",
                    color: "var(--foreground)",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="var(--primary)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Order Trends Card */}
        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-slate-800">
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Order Trends</h3>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dynamicOrdersData}
                margin={{ left: -10, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    backgroundColor: "var(--card)",
                    borderColor: "var(--color-border)",
                    color: "var(--foreground)",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 5, fill: "#ffffff", stroke: "var(--primary)", strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 2: Revenue by Category & Top Selling Products */}
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        {/* Revenue by Category Card */}
        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-slate-800 flex flex-col">
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Revenue by Category</h3>
          </div>
          <div className="mt-4 flex-1 flex flex-col justify-center items-center h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dynamicCategoryRevenue}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {dynamicCategoryRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${Number(value).toFixed(2)}%`}
                  contentStyle={{
                    borderRadius: 12,
                    backgroundColor: "var(--card)",
                    borderColor: "var(--color-border)",
                    color: "var(--foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Centered Legend at the bottom */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {dynamicCategoryRevenue.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Selling Products Card */}
        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-slate-800">
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Top Selling Products</h3>
          </div>
          <div className="mt-6 space-y-6.5">
            {dynamicTopProducts.map((product, idx) => {
              const maxSold = dynamicTopProducts.length > 0 ? Math.max(...dynamicTopProducts.map(p => p.sold)) : 1;
              const percentage = maxSold > 0 ? (product.sold / maxSold) * 100 : 0;
              return (
                <div key={product.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[15px] font-semibold">
                    <span className="text-slate-900 dark:text-white">
                      {idx + 1}. {product.name}
                    </span>
                    <span className="text-slate-400 font-medium text-[13px]">
                      {product.sold} sold
                    </span>
                  </div>
                  {/* Progress bar container */}
                  <div className="w-full h-[9px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#15803d] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

