// @ts-nocheck
import { useState, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import IndexPage from './pages'
import { getSession } from './pages/index'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import SignUp from './pages/auth/SignUp'
import OtpPage from './pages/auth/OtpPage'
import ResetPwd from './pages/auth/ResetPwd'
import AdminDashboard from './pages/admin/Dashboard'
import Products from './pages/common/Products'
import Categories from './pages/common/Categories'
import Inventory from './pages/common/Inventory'
import Orders from './pages/common/Orders'
import AdminProfile from './pages/admin/Profile'
import AdminSidebar from './components/AdminSidebar'
import Navbar from './components/Navbar'
import SuperAdminDashboard from './pages/superadmin/Dashboard'
import ManageUsers from './pages/superadmin/ManageUsers'
import ManageAdmins from './pages/superadmin/ManageAdmins'
import Revenue from './pages/superadmin/Revenue'
import SuperProfile from './pages/superadmin/Profile'
import SuperAdminSidebar from './components/SuperAdminSidebar'
import { initTheme } from './components/Navbar'

function RoleSelectionRoute() {
  const navigate = useNavigate()

  return (
    <IndexPage
      onSelectRole={(selectedRole) => {
        if (selectedRole === 'admin') {
          navigate('/auth/admin')
          return
        }

        navigate('/auth/superadmin')
      }}
    />
  )
}

function AdminAuthRoute() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')

  return (
    <Login
      role="admin"
      mode={mode}
      onModeChange={setMode}
      onBack={() => navigate('/')}
      onLogin={(user) => {
        if (user?.isSuperAdmin) {
          navigate('/superadmin/dashboard')
        } else {
          navigate('/admin/dashboard')
        }
      }}
    />
  )
}

function SuperAdminAuthRoute() {
  const navigate = useNavigate()

  return (
    <Login
      role="superadmin"
      mode="login"
      onModeChange={() => { }}
      onBack={() => navigate('/')}
      onLogin={(user) => {
        if (user?.isSuperAdmin) {
          navigate('/superadmin/dashboard')
        } else {
          navigate('/admin/dashboard')
        }
      }}
    />
  )
}

function AdminSignUpRoute() {
  const navigate = useNavigate()

  return <SignUp onModeChange={() => navigate('/auth/admin')} />
}

function AdminLayout({ children }) {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    const checkStatus = async () => {
      const session = getSession()
      if (!session) {
        navigate('/auth/admin')
        return
      }
      try {
        const res = await fetch(`${base}/api/auth/admin/me`, {
          headers: {
            Authorization: `Bearer ${session.token}`
          }
        })
        if (res.ok) {
          const profile = await res.json()
          const status = profile.status === 'ACTIVE' ? 'Active' : profile.status === 'PENDING' ? 'Pending' : 'Suspended'
          const updated = { ...session, status }
          localStorage.setItem('grocery_session', JSON.stringify(updated))
          setUser(updated)
        } else {
          setUser(session)
        }
      } catch (err) {
        setUser(session)
      } finally {
        setLoading(false)
      }
    }
    checkStatus()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (user?.status === 'Pending') {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl text-center border border-slate-200/60 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 mb-6 border border-amber-200 dark:border-amber-900/40">
            <svg className="h-8 w-8 text-amber-500 dark:text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white mb-3">Approval Pending</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
            Please wait for the super admin approval before accessing the administrator console.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('grocery_session');
              navigate('/');
            }}
            className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold cursor-pointer transition-colors shadow-sm"
          >
            Log Out
          </button>
        </div>
      </main>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-200">
      <AdminSidebar onSignOut={() => navigate('/')} isCollapsed={!isSidebarOpen} />

      <div className={`transition-all duration-300 flex min-w-0 flex-1 flex-col ${isSidebarOpen ? 'ml-[260px]' : 'ml-[88px]'}`}>
        <Navbar
          role="ADMIN"
          name={user?.name || "Alex Carter"}
          email={user?.email || "admin@mkbsmart.com"}
          avatarText={user?.initials || "AC"}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        {children}
      </div>
    </div>
  )
}

function SuperAdminLayout({ children }) {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getSession())
  }, [])

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-200">
      <SuperAdminSidebar onSignOut={() => navigate('/')} isCollapsed={!isSidebarOpen} />

      <div className={`transition-all duration-300 flex min-w-0 flex-1 flex-col ${isSidebarOpen ? 'ml-[260px]' : 'ml-[88px]'}`}>
        <Navbar
          role="SUPER ADMIN"
          name={user?.name || "Ariana White"}
          email={user?.email || "super@mkbsmart.com"}
          avatarText={user?.initials || "AW"}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        {children}
      </div>
    </div>
  )
}

function App() {
  useEffect(() => {
    initTheme()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelectionRoute />} />
        <Route path="/auth/admin" element={<AdminAuthRoute />} />
        <Route path="/auth/admin/signup" element={<AdminSignUpRoute />} />
        <Route path="/auth/superadmin" element={<SuperAdminAuthRoute />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/admin/otp" element={<OtpPage />} />
        <Route path="/auth/admin/reset-password" element={<ResetPwd />} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <AdminLayout>
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<main className="flex-1 overflow-auto p-8"><Products /></main>} />
              <Route path="categories" element={<main className="flex-1 overflow-auto p-8"><Categories /></main>} />
              <Route path="inventory" element={<main className="flex-1 overflow-auto p-8"><Inventory /></main>} />
              <Route path="orders" element={<main className="flex-1 overflow-auto p-8"><Orders /></main>} />
              <Route path="profile" element={<main className="flex-1 overflow-auto p-8"><AdminProfile /></main>} />
            </Routes>
          </AdminLayout>
        } />

        {/* SuperAdmin Routes */}
        <Route path="/superadmin/*" element={
          <SuperAdminLayout>
            <Routes>
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="products" element={<main className="flex-1 overflow-auto p-8"><Products /></main>} />
              <Route path="categories" element={<main className="flex-1 overflow-auto p-8"><Categories /></main>} />
              <Route path="inventory" element={<main className="flex-1 overflow-auto p-8"><Inventory /></main>} />
              <Route path="orders" element={<main className="flex-1 overflow-auto p-8"><Orders /></main>} />
              <Route path="users" element={<main className="flex-1 overflow-auto p-8"><ManageUsers /></main>} />
              <Route path="admins" element={<main className="flex-1 overflow-auto p-8"><ManageAdmins /></main>} />
              <Route path="revenue" element={<main className="flex-1 overflow-auto p-8"><Revenue /></main>} />
              <Route path="profile" element={<main className="flex-1 overflow-auto p-8"><SuperProfile /></main>} />
            </Routes>
          </SuperAdminLayout>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
