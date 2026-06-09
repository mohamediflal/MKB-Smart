// @ts-nocheck
import { useState, useEffect } from "react";
import { Plus, MoreVertical, Pencil, Trash2, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Card, admins } from "../index";

export default function ManageAdmins() {
  const [adminsList, setAdminsList] = useState(() => admins);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [status, setStatus] = useState("Active");

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

  const saveAdmins = (updatedList) => {
    setAdminsList(updatedList);
    localStorage.setItem("grocery_admins_v2", JSON.stringify(updatedList));
    // Keep module level admins array in-sync
    admins.length = 0;
    admins.push(...updatedList);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      triggerToast("Please fill in all fields");
      return;
    }

    try {
      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
      const res = await fetch(`${base}/api/auth/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, status }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create admin')
      }

      const data = await res.json()
      const newAdmin = {
        id: data.admin.id,
        name: data.admin.name,
        email: data.admin.email,
        role: data.admin.isSuperAdmin ? 'super_admin' : 'admin',
        lastActive: new Date().toISOString().slice(0, 16).replace('T', ' '),
        status,
      }

      saveAdmins([...adminsList, newAdmin]);
      setShowAddModal(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("admin");
      setStatus("Active");
      triggerToast("Admin added successfully");
    } catch (err) {
      triggerToast(err?.message || 'Failed to create admin')
    }
  };

  const handleOpenEdit = (admin) => {
    setSelectedAdmin(admin);
    setName(admin.name);
    setEmail(admin.email);
    setRole(admin.role);
    setStatus(admin.status || "Active");
    setShowEditModal(true);
  };

  const handleEditAdmin = (e) => {
    e.preventDefault();
    if (!name || !email) {
      triggerToast("Please fill in all fields");
      return;
    }

    const updated = adminsList.map(a => 
      a.id === selectedAdmin.id 
        ? { ...a, name, email, role, status } 
        : a
    );

    saveAdmins(updated);
    setShowEditModal(false);
    setSelectedAdmin(null);
    setName("");
    setEmail("");
    triggerToast("Admin profile updated");
  };

  const handleDeleteAdmin = (id) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      const updated = adminsList.filter(a => a.id !== deletingId);
      saveAdmins(updated);
      triggerToast("Admin removed");
      setDeletingId(null);
    }
  };

  const handleToggleStatus = (admin) => {
    const newStatus = admin.status === "Inactive" ? "Active" : "Inactive";
    const updated = adminsList.map(a => 
      a.id === admin.id ? { ...a, status: newStatus } : a
    );
    saveAdmins(updated);
    triggerToast(`Status changed to ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Admins</h1>
      </div>

      {/* Main Admin Accounts Table Card */}
      <Card className="!p-0 overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center p-6 gap-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Admin accounts</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage admin and super admin access</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} /> Add Admin
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[13px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Name</th>
                <th className="px-6 py-4 text-left font-semibold">Email</th>
                <th className="px-6 py-4 text-left font-semibold">Role</th>
                <th className="px-6 py-4 text-left font-semibold">Last Login</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-center w-24 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {adminsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No admin accounts found.
                  </td>
                </tr>
              ) : (
                adminsList.map((a, index) => {
                  const isBottomRow = index >= adminsList.length - 2 && adminsList.length > 2;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{a.name}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{a.email}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                        {a.role === "super_admin" ? "Super Admin" : "Admin"}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                        {a.lastActive || a.lastLogin}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          a.status === "Active" 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" 
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
                        }`}>
                          {a.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === a.id ? null : a.id);
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-slate-900 hover:text-slate-700 dark:text-slate-200 dark:hover:text-slate-200 transition"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {/* Dropdown Options Menu */}
                        {activeMenuId === a.id && (
                          <div 
                            className={`absolute right-6 z-10 w-44 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl animate-in fade-in duration-150 ${
                              isBottomRow 
                                ? "bottom-10 origin-bottom" 
                                : "top-12 origin-top"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                handleOpenEdit(a);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Pencil size={14} /> Edit Admin
                            </button>
                            <button
                              onClick={() => {
                                handleToggleStatus(a);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <ShieldAlert size={14} /> Toggle Status
                            </button>
                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                            <button
                              onClick={() => {
                                handleDeleteAdmin(a.id);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                            >
                              <Trash2 size={14} /> Remove Admin
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
      </Card>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Admin</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddAdmin} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@mkbsmart.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm cursor-pointer transition"
                >
                  Add Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
          onClick={() => {
            setShowEditModal(false);
            setSelectedAdmin(null);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Admin Profile</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAdmin(null);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditAdmin} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAdmin(null);
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm cursor-pointer transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Remove Admin</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to remove this admin? This action cannot be undone.</p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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

