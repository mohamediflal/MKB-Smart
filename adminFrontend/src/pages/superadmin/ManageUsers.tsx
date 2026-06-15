// @ts-nocheck
import { useState, useEffect } from "react";
import { MoreVertical, Trash2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Card, PageHeader, getSession } from "../index";

export default function ManageUsers() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const session = getSession();
      const token = session?.token;

      const res = await fetch(`${base}/api/auth/list-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close active dropdown menu when clicking anywhere else
  useEffect(() => {
    const handleClose = () => setActiveMenuId(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "Active" ? "Suspended" : "Active";

    try {
      const session = getSession();
      const token = session?.token;

      const res = await fetch(`${base}/api/auth/admin/update-user-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: user.id,
          status: newStatus
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update user status');
      }

      await fetchUsers();
      triggerToast(`Status changed to ${newStatus}`);
    } catch (err) {
      triggerToast(err?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = (id) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        const session = getSession();
        const token = session?.token;

        const res = await fetch(`${base}/api/auth/admin/delete-user`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ id: deletingId }),
        });

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || 'Failed to remove user');
        }

        await fetchUsers();
        triggerToast("User account removed");
      } catch (err) {
        triggerToast(err?.message || 'Failed to remove user');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="All registered customers" />
      
      <Card className="!p-0 overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-3 text-slate-500 text-sm font-semibold">Loading user accounts...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[13px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Customer</th>
                  <th className="px-6 py-4 text-left font-semibold">Email</th>
                  <th className="px-6 py-4 text-left font-semibold">Orders</th>
                  <th className="px-6 py-4 text-left font-semibold">Spent</th>
                  <th className="px-6 py-4 text-left font-semibold">Joined</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-center w-24 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u, index) => {
                    const isBottomRow = index >= usersList.length - 2 && usersList.length > 2;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold">
                            {u.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{u.name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{u.email}</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{u.orders}</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100">Rs. {u.spent.toFixed(2)}</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{u.joined}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${u.status === "Active" 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" 
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
                            }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === u.id ? null : u.id);
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-slate-900 hover:text-slate-700 dark:text-slate-200 dark:hover:text-slate-200 transition"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {/* Dropdown Options Menu */}
                          {activeMenuId === u.id && (
                            <div
                              className={`absolute right-6 z-10 w-44 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl animate-in fade-in duration-150 ${isBottomRow
                                ? "bottom-10 origin-bottom"
                                : "top-12 origin-top"
                                }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  handleToggleStatus(u);
                                  setActiveMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <ShieldAlert size={14} /> Toggle Status
                              </button>
                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                              <button
                                onClick={() => {
                                  handleDeleteUser(u.id);
                                  setActiveMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                              >
                                <Trash2 size={14} /> Remove User
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
          onClick={() => setDeletingId(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 mb-4">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Remove User</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to remove this customer account? This action cannot be undone.</p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm cursor-pointer"
              >
                Remove
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
