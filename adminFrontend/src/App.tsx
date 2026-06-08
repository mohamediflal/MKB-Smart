// @ts-nocheck
import { useState, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import IndexPage from './pages'
import { getSession } from './pages/index'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import SignUp from './pages/auth/SignUp'
import AdminDashboard from './pages/admin/Dashboard'
import Products from './pages/admin/Products'
import Categories from './pages/admin/Categories'
import Inventory from './pages/admin/Inventory'
import Orders from './pages/admin/Orders'
import AddProduct from './pages/admin/AddProduct'
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
      onLogin={() => navigate('/admin/dashboard')}
    />
  )
}

function SuperAdminAuthRoute() {
  const navigate = useNavigate()

  return (
    <Login
      role="superadmin"
      mode="login"
      onModeChange={() => {}}
      onBack={() => navigate('/')}
      onLogin={() => navigate('/superadmin/dashboard')}
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

  useEffect(() => {
    setUser(getSession())
  }, [])

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
              <Route path="add-product" element={<main className="flex-1 overflow-auto p-8"><AddProduct /></main>} />
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
