// @ts-nocheck
const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/superadmin/dashboard' },
  { key: 'products', label: 'Products', icon: 'products', path: '/superadmin/products' },
  { key: 'categories', label: 'Categories', icon: 'tag', path: '/superadmin/categories' },
  { key: 'inventory', label: 'Inventory', icon: 'inventory', path: '/superadmin/inventory' },
  { key: 'orders', label: 'Orders', icon: 'cart', path: '/superadmin/orders' },
  { key: 'users', label: 'Users', icon: 'users', path: '/superadmin/users' },
  { key: 'admins', label: 'Admins', icon: 'shield', path: '/superadmin/admins' },
  { key: 'revenue', label: 'Revenue Analytics', icon: 'chart', path: '/superadmin/revenue' },
  { key: 'profile', label: 'Profile', icon: 'profile', path: '/superadmin/profile' },
]

function SidebarIcon({ name, className = '' }) {
  if (name === 'dashboard') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }

  if (name === 'products') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m4.6 7.7 7.4 4.3 7.4-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 12v8.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'tag') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path
          d="M11.5 3H6a2 2 0 0 0-2 2v5.5L12.6 19a2 2 0 0 0 2.8 0l3.6-3.6a2 2 0 0 0 0-2.8L11.5 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="7.6" cy="7.6" r="1.2" fill="currentColor" />
      </svg>
    )
  }

  if (name === 'inventory') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="m12 3 7 4v8l-7 4-7-4V7l7-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m5 8 7 4 7-4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 12v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m3 9 4 2.2M21 9l-4 2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'cart') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M3.5 4h2.8L8.5 14h9.8l2.2-7H7.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9.5" cy="18.5" r="1.4" fill="currentColor" />
        <circle cx="17" cy="18.5" r="1.4" fill="currentColor" />
      </svg>
    )
  }

  if (name === 'users') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <circle cx="8.5" cy="8.3" r="2.7" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="15.8" cy="9.2" r="2.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.8 18c.8-2.7 2.7-4 5.1-4s4.3 1.3 5.1 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M13.2 18c.5-1.9 1.9-2.8 3.5-2.8 1.6 0 2.9.9 3.5 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'shield') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="m12 3 7 3.2V11c0 4.2-2.5 7.4-7 9.8-4.5-2.4-7-5.6-7-9.8V6.2L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m9.3 11.8 1.8 1.8 3.8-3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'chart') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M4.5 20V6m5 14V10m5 10V4m5 16v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M3.5 20h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'report') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M7 3.8h7.2L19 8.6V20H7V3.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 3.8v4.8h5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10 12h6M10 15.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'logs') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <rect x="4" y="5" width="10" height="12" rx="1.7" stroke="currentColor" strokeWidth="1.8" />
        <rect x="10" y="9" width="10" height="10" rx="1.7" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 8h4M7 11h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'settings') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path
          d="M10.7 3.5h2.6l.5 2a6.7 6.7 0 0 1 1.7.7l1.8-1.1 1.8 1.8-1.1 1.8c.3.5.6 1.1.7 1.7l2 .5v2.6l-2 .5a6.7 6.7 0 0 1-.7 1.7l1.1 1.8-1.8 1.8-1.8-1.1c-.5.3-1.1.6-1.7.7l-.5 2h-2.6l-.5-2a6.7 6.7 0 0 1-1.7-.7l-1.8 1.1-1.8-1.8 1.1-1.8a6.7 6.7 0 0 1-.7-1.7l-2-.5v-2.6l2-.5c.1-.6.4-1.2.7-1.7L4.9 6.9l1.8-1.8 1.8 1.1c.5-.3 1.1-.6 1.7-.7l.5-2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }

  if (name === 'profile') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5.5 19a7 7 0 0 1 13 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }

  return null
}

function itemClassName(isActive) {
  if (isActive) {
    return 'bg-primary text-primary-foreground font-semibold shadow-sm'
  }

  return 'bg-transparent text-foreground hover:bg-muted hover:text-foreground'
}

import { useLocation, useNavigate } from 'react-router-dom'

function SuperAdminSidebar({ onItemSelect, onSignOut, isCollapsed }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNav = (key) => {
    switch (key) {
      case 'dashboard':
        navigate('/superadmin/dashboard')
        break
      case 'products':
        navigate('/superadmin/products')
        break
      case 'categories':
        navigate('/superadmin/categories')
        break
      case 'inventory':
        navigate('/superadmin/inventory')
        break
      case 'orders':
        navigate('/superadmin/orders')
        break
      case 'users':
        navigate('/superadmin/users')
        break
      case 'admins':
        navigate('/superadmin/admins')
        break
      case 'revenue':
        navigate('/superadmin/revenue')
        break
      case 'profile':
        navigate('/superadmin/profile')
        break
      default:
        onItemSelect?.(key)
    }
  }

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ${isCollapsed ? 'w-[88px]' : 'w-[260px]'}`}>
      <div className="px-5 pb-6 pt-6">
        <div className={`mb-8 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm">
            M
          </div>
          {!isCollapsed && (
            <div className="leading-tight overflow-hidden whitespace-nowrap">
              <div className="text-[18px] font-bold tracking-tight text-sidebar-foreground">MKB-Smart</div>
              <div className="mt-0.5 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">System Admin</div>
            </div>
          )}
        </div>

        <nav className="space-y-2.5 flex flex-col items-center" aria-label="Sidebar navigation">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNav(item.key)}
              className={`flex h-12 items-center text-[15px] font-medium transition-all duration-200 overflow-hidden cursor-pointer ${
                isCollapsed 
                  ? 'w-12 justify-center rounded-2xl px-0' 
                  : 'w-full gap-4 rounded-full px-5 text-left'
              } ${itemClassName(location.pathname === item.path)}`}
            >
              <SidebarIcon name={item.icon} className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-sidebar-border px-5 py-5 flex justify-center">
        <button
          type="button"
          onClick={onSignOut}
          className={`flex items-center text-[15px] font-medium text-foreground hover:text-foreground transition-all cursor-pointer ${isCollapsed ? 'justify-center w-12 h-12 rounded-2xl hover:bg-muted' : 'w-full gap-4 px-2 py-2 rounded-full hover:bg-muted'}`}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
            <path d="M10 4H5.8A1.8 1.8 0 0 0 4 5.8v12.4A1.8 1.8 0 0 0 5.8 20H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="m13 8 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 12h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {!isCollapsed && <span className="whitespace-nowrap">Sign out</span>}
        </button>
      </div>
    </aside>
  )
}

export default SuperAdminSidebar
