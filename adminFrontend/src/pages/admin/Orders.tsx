// @ts-nocheck
import { useState } from "react";
import { Eye, Search, Pencil, Trash2, Printer, X, Check, CheckCircle2 } from "lucide-react";
import { Card, PageHeader, orders, statusColor, products } from "../index";
import { jsPDF } from "jspdf";

/**
 * Generates and downloads a professional invoice PDF for a given order and its items.
 */
function downloadInvoicePDF(order, items) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const PRIMARY_COLOR = [5, 150, 105];
  const TEXT_DARK = [30, 41, 59];
  const TEXT_MUTED = [100, 116, 139];
  const LIGHT_GRAY = [248, 250, 252];
  const BORDER_COLOR = [226, 232, 240];

  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(20, 20, 4, 22, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...TEXT_DARK);
  doc.text("MKB SUPERMARKET", 28, 27);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("ONLINE GROCERY & FRESH FOODS - BADULLA", 28, 33);
  doc.text("www.mkbsmart.com", 28, 38);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("INVOICE", 190, 27, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Invoice ID: ${order.id}`, 190, 34, { align: "right" });
  doc.text(`Date: ${order.date}`, 190, 40, { align: "right" });

  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(20, 48, 190, 48);

  const infoStartY = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("BILL FROM", 20, infoStartY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("MKB Supermarket", 20, infoStartY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("38 Race Course Rd", 20, infoStartY + 12);
  doc.text("Badulla, 90000, Sri Lanka", 20, infoStartY + 18);
  doc.text("support@mkbsmart.com", 20, infoStartY + 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("BILL TO", 110, infoStartY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text(order.customer, 110, infoStartY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);
  const cleanEmail = order.customer.toLowerCase().replace(/\s+/g, ".") + "@mail.com";
  doc.text(cleanEmail, 110, infoStartY + 12);
  doc.text("15 Keppetipola Rd", 110, infoStartY + 18);
  doc.text("Badulla, Sri Lanka", 110, infoStartY + 24);

  const summaryBoxY = infoStartY + 32;
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(20, summaryBoxY, 170, 15, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Payment Method:", 25, summaryBoxY + 9);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_MUTED);
  doc.text(order.payment, 58, summaryBoxY + 9);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_DARK);
  doc.text("Order Status:", 115, summaryBoxY + 9);

  const status = order.status || "Pending";
  let statusClr = PRIMARY_COLOR;
  if (status === "Pending") statusClr = [217, 119, 6];
  if (status === "Cancelled") statusClr = [225, 29, 72];
  if (status === "Processing") statusClr = [14, 165, 233];
  if (status === "Shipped") statusClr = [139, 92, 246];

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...statusClr);
  doc.text(status, 142, summaryBoxY + 9);

  const tableStartY = summaryBoxY + 26;

  doc.setFillColor(241, 245, 249);
  doc.rect(20, tableStartY, 170, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Item Description", 24, tableStartY + 6);
  doc.text("Qty", 120, tableStartY + 6, { align: "center" });
  doc.text("Unit Price", 150, tableStartY + 6, { align: "right" });
  doc.text("Total", 185, tableStartY + 6, { align: "right" });

  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(20, tableStartY + 9, 190, tableStartY + 9);

  let currentY = tableStartY + 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  items.forEach((item, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(...LIGHT_GRAY);
      doc.rect(20, currentY - 5, 170, 8, "F");
    }

    doc.setTextColor(...TEXT_DARK);
    doc.text(item.name, 24, currentY);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(String(item.qty), 120, currentY, { align: "center" });
    doc.text(`Rs. ${item.price.toFixed(2)}`, 150, currentY, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(`Rs. ${item.total.toFixed(2)}`, 185, currentY, { align: "right" });
    doc.setFont("helvetica", "normal");

    doc.setDrawColor(241, 245, 249);
    doc.line(20, currentY + 3, 190, currentY + 3);

    currentY += 8;
  });

  currentY += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Invoice Total:", 145, currentY, { align: "right" });

  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(`Rs. ${order.amount.toFixed(2)}`, 185, currentY, { align: "right" });

  const footerY = 262;

  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 5, 190, footerY - 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Thank you for shopping with MKB Supermarket!", 105, footerY, { align: "center" });
  doc.text("If you have any questions or require support, contact support@mkbsmart.com", 105, footerY + 5, { align: "center" });

  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(20, footerY + 12, 170, 2, "F");

  const filename = `Invoice_${order.id.replace("#", "")}.pdf`;
  doc.save(filename);
}

const STATUSES = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function Orders() {
  const [ordersList, setOrdersList] = useState(orders);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleStatusChange = (orderId, newStatus) => {
    const updated = ordersList.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrdersList(updated);
    
    // Update global store
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = newStatus;
      if (typeof window !== "undefined") {
        localStorage.setItem("grocery_orders", JSON.stringify(orders));
      }
    }
    
    // Update selectedOrder if it is currently open
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    setToastMessage(`Order status updated to ${newStatus}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handlePrint = (order) => {
    const items = getOrderItems(order);
    downloadInvoicePDF(order, items);

    setToastMessage(`Invoice downloaded for ${order.id}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getOrderItems = (order) => {
    const orderIdNum = parseInt(order.id.replace(/\D/g, ""), 10) || 0;
    
    const availableProducts = products.length > 0 ? products : [
      { name: "Organic Bananas", price: 2.00, emoji: "🍌" },
      { name: "Whole Milk 1L", price: 3.50, emoji: "🥛" },
      { name: "Sourdough Loaf", price: 4.50, emoji: "🍞" },
      { name: "Free-Range Eggs", price: 5.00, emoji: "🥚" },
      { name: "Fresh Avocado", price: 2.50, emoji: "🥑" },
      { name: "Roma Tomatoes", price: 3.00, emoji: "🍅" }
    ];

    const itemCount = order.items || 1;
    const items = [];
    let remainingAmount = order.amount;

    for (let i = 0; i < itemCount; i++) {
      const prodIndex = (orderIdNum + i) % availableProducts.length;
      const prod = availableProducts[prodIndex];
      
      if (i === itemCount - 1) {
        const price = parseFloat(remainingAmount.toFixed(2));
        if (price > 0) {
          items.push({
            name: prod.name,
            qty: 1,
            price: price,
            total: price
          });
        }
      } else {
        const targetPrice = parseFloat((remainingAmount / (itemCount - i)).toFixed(2));
        const price = Math.max(0.5, Math.min(targetPrice, prod.price || 2.00));
        const qty = 1;
        const total = price * qty;
        items.push({
          name: prod.name,
          qty: qty,
          price: price,
          total: total
        });
        remainingAmount -= total;
      }
    }

    const currentTotal = items.reduce((sum, item) => sum + item.total, 0);
    const diff = order.amount - currentTotal;
    if (Math.abs(diff) > 0.001 && items.length > 0) {
      items[items.length - 1].price = parseFloat((items[items.length - 1].price + diff).toFixed(2));
      items[items.length - 1].total = items[items.length - 1].price;
    }

    return items;
  };

  const list = ordersList.filter(
    (o) => (st === "All" || o.status === st) &&
      (o.id.toLowerCase().includes(q.toLowerCase()) || o.customer.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div>
      <PageHeader title="Orders" subtitle="Track and manage customer orders" />
      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border">
          <div className="flex-1 min-w-64 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search orders or customers..."
              className="w-full rounded-full border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
            {STATUSES.map((s) => (
              <button
                key={s} onClick={() => setSt(s)}
                className={`rounded-full px-3 py-1.5 font-medium transition-all cursor-pointer ${st === s ? "bg-white dark:bg-slate-800 shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[15px] text-slate-900 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Order ID</th>
                <th className="px-6 py-3 text-left font-medium">Customer</th>
                <th className="px-6 py-3 text-left font-medium">Items</th>
                <th className="px-6 py-3 text-left font-medium">Payment</th>
                <th className="px-6 py-3 text-left font-medium">Total</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              ) : (
                list.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{o.id}</td>
                    <td className="px-6 py-3 text-foreground">{o.customer}</td>
                    <td className="px-6 py-3 text-foreground">{o.items}</td>
                    <td className="px-6 py-3 text-foreground">{o.payment}</td>
                    <td className="px-6 py-3 text-foreground">Rs. {o.amount.toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(o.status)}`}>{o.status}</span>
                    </td>
                    <td className="px-6 py-3 text-foreground">{o.date}</td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-foreground">
                        <button 
                          onClick={() => setSelectedOrder(o)}
                          className="rounded-md p-1.5 hover:bg-accent hover:text-foreground cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </button>
                        <button 
                          onClick={() => handlePrint(o)}
                          className="rounded-md p-1.5 hover:bg-accent hover:text-foreground cursor-pointer"
                          title="Print Invoice"
                        >
                          <Printer size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Order {selectedOrder.id}
                </h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Details */}
                <div className="space-y-4 text-left">
                  <div>
                    <h4 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Customer</h4>
                    <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 mt-1">{selectedOrder.customer}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{selectedOrder.customer.toLowerCase().replace(' ', '.')}@mail.com</p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Delivery Address</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      15 Keppetipola Rd, Badulla, Sri Lanka
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Payment</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 font-medium">
                      {selectedOrder.payment} · Paid
                    </p>
                  </div>
                </div>

                {/* Right Column: Timeline */}
                <div className="text-left">
                  <h4 className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-4">Timeline</h4>
                  <div className="flex flex-col gap-6">
                    {[
                      { label: "Placed", key: "Pending" },
                      { label: "Processing", key: "Processing" },
                      { label: "Shipped", key: "Shipped" },
                      { label: "Delivered", key: "Delivered" }
                    ].map((step, idx) => {
                      const getStepStatus = (orderStatus, stepIndex) => {
                        const statusOrder = ["Pending", "Processing", "Shipped", "Delivered"];
                        const currentIdx = statusOrder.indexOf(orderStatus);
                        if (orderStatus === "Cancelled") {
                          return stepIndex === 0 ? "completed" : "inactive";
                        }
                        return currentIdx >= stepIndex ? "completed" : "inactive";
                      };

                      const isCompleted = getStepStatus(selectedOrder.status, idx) === "completed";
                      return (
                        <div key={step.label} className="flex items-start gap-4 relative">
                          {idx < 3 && (
                            <div className="absolute left-[13px] top-7 bottom-[-24px] w-0.5 bg-slate-100 dark:bg-slate-800" />
                          )}
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 z-10 ${
                            isCompleted 
                              ? "bg-emerald-600 text-white" 
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}>
                            {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                          </div>
                          <div className="pt-0.5">
                            <p className={`text-[15px] font-semibold ${isCompleted ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-600"}`}>
                              {step.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Product Items Table */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mt-6 bg-white dark:bg-slate-900/50">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3 text-center">Qty</th>
                      <th className="px-6 py-3 text-right">Price</th>
                      <th className="px-6 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {getOrderItems(selectedOrder).map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-3.5 font-medium text-slate-950 dark:text-white">{item.name}</td>
                        <td className="px-6 py-3.5 text-center text-slate-500">{item.qty}</td>
                        <td className="px-6 py-3.5 text-right text-slate-500">Rs. {item.price.toFixed(2)}</td>
                        <td className="px-6 py-3.5 text-right font-medium text-slate-950 dark:text-white">Rs. {item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/20 dark:bg-slate-800/20">
                      <td colSpan={3} className="px-6 py-3.5 text-right font-bold text-slate-900 dark:text-white">Order total</td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-900 dark:text-white text-base">Rs. {selectedOrder.amount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500">Update status:</span>
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm outline-none cursor-pointer focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                >
                  {STATUSES.filter(s => s !== "All").map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => handlePrint(selectedOrder)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer"
              >
                <Printer size={16} /> Print invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-16 right-6 z-[60] flex items-center gap-3 rounded-2xl bg-[#dcfce7] border border-[#bbf7d0] px-5 py-4 shadow-lg animate-in slide-in-from-top-4 fade-in duration-300 min-w-[240px]">
          <CheckCircle2 size={22} className="shrink-0 text-[#16a34a]" fill="#16a34a" color="white" />
          <span className="font-semibold text-[15px] text-[#166534]">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

