// @ts-nocheck
import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import NotificationMenu from './NotificationMenue'
import { getSession } from '../pages/index'

// ─── Theme Configuration (merged from utils/theme.js) ───

const ACCENT_COLORS = [
  { name: 'Charcoal Slate', value: '#3c4a57' },
  { name: 'Sand Brown', value: '#7a6148' },
  { name: 'Sunset Orange', value: '#ff6b4a' },
  { name: 'Coral Pink', value: '#ff8f95' },
  { name: 'Crimson Red', value: '#ff4d4d' },
  { name: 'Plum Berry', value: '#993d5a' },
  { name: 'Deep Violet', value: '#5b3b75' },
  { name: 'Vivid Purple', value: '#9b59b6' },
  { name: 'Indigo Blue', value: '#6c5ce7' },
  { name: 'Ocean Blue', value: '#0984e3' },
  { name: 'Bright Cyan', value: '#00cec9' },
  { name: 'Teal Green', value: '#00b894' },
  { name: 'Mint Aqua', value: '#81ecec' },
  { name: 'Lime Green', value: '#55efc4' },
  { name: 'Pastel Yellow', value: '#ffeaa7' },
  { name: 'Amber Gold', value: '#fdcb6e' }
];

const WORKSPACE_THEMES = [
  {
    id: 'dark', name: 'Dark', bgColor: '#131518', cardBg: '#1e2024',
    border: '#282b30', fgColor: '#f1f2f5', muted: '#22252a', mutedFg: '#94a3b8',
    sidebar: '#1e2024', sidebarFg: '#e2e8f0', sidebarBorder: '#282b30'
  },
  {
    id: 'dim', name: 'Dim', bgColor: '#23272d', cardBg: '#2f343f',
    border: '#3b404d', fgColor: '#e9eaec', muted: '#303540', mutedFg: '#b9bbbe',
    sidebar: '#242830', sidebarFg: '#dcddde', sidebarBorder: '#353a45'
  },
  {
    id: 'light-gray', name: 'Light Gray', bgColor: '#b8bec9', cardBg: '#e9ebef',
    border: '#a4abb8', fgColor: '#181c24', muted: '#dbe0ea', mutedFg: '#5a6270',
    sidebar: '#d1d5db', sidebarFg: '#252a32', sidebarBorder: '#b8bec9'
  },
  {
    id: 'off-white', name: 'Off White', bgColor: '#f2f4f7', cardBg: '#ffffff',
    border: '#e2e8f0', fgColor: '#0f172a', muted: '#f1f5f9', mutedFg: '#64748b',
    sidebar: '#ffffff', sidebarFg: '#334155', sidebarBorder: '#e2e8f0'
  }
];

const DEFAULT_ACCENT = '#0e7f46';
const DEFAULT_WORKSPACE = 'off-white';

const hexToRgba = (hex, opacity) => {
  let c = hex.substring(1);
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

function applyAccentColor(hex) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--primary', hex);
  root.style.setProperty('--ring', hex);
  const lighter = hexToRgba(hex, 0.1);
  root.style.setProperty('--accent', lighter);
  root.style.setProperty('--accent-foreground', hex);
  const isLightColor = ['#ffeaa7', '#fdcb6e', '#55efc4', '#81ecec', '#ff8f95'].includes(hex.toLowerCase());
  const fg = isLightColor ? '#111827' : '#ffffff';
  root.style.setProperty('--primary-foreground', fg);
  root.style.setProperty('--chart-1', hex);
  localStorage.setItem('grocery_accent', hex);
}

function applyWorkspaceTheme(mode) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const theme = WORKSPACE_THEMES.find(t => t.id === mode) || WORKSPACE_THEMES[3];
  const isDark = mode === 'dark' || mode === 'dim';
  root.classList.toggle('dark', isDark);
  root.style.setProperty('--background', theme.bgColor);
  root.style.setProperty('--card', theme.cardBg);
  root.style.setProperty('--foreground', theme.fgColor);
  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--muted', theme.muted);
  root.style.setProperty('--muted-foreground', theme.mutedFg);
  root.style.setProperty('--sidebar', theme.sidebar);
  root.style.setProperty('--sidebar-foreground', theme.sidebarFg);
  root.style.setProperty('--sidebar-border', theme.sidebarBorder);
  document.body.style.color = theme.fgColor;
  localStorage.setItem('grocery_workspace', mode);
}

export function initTheme() {
  const accent = localStorage.getItem('grocery_accent') || DEFAULT_ACCENT;
  const workspace = localStorage.getItem('grocery_workspace') || DEFAULT_WORKSPACE;
  applyAccentColor(accent);
  applyWorkspaceTheme(workspace);
}

// ─── End Theme Configuration ───

function SettingsModal({ isOpen, onClose }) {
  const [currentAccent, setCurrentAccent] = useState(DEFAULT_ACCENT);
  const [currentWorkspace, setCurrentWorkspace] = useState(DEFAULT_WORKSPACE);

  // Load current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const storedAccent = localStorage.getItem('grocery_accent') || DEFAULT_ACCENT;
      const storedWorkspace = localStorage.getItem('grocery_workspace') || DEFAULT_WORKSPACE;
      setCurrentAccent(storedAccent);
      setCurrentWorkspace(storedWorkspace);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccentChange = (hex) => {
    setCurrentAccent(hex);
    applyAccentColor(hex);
  };

  const handleWorkspaceChange = (id) => {
    setCurrentWorkspace(id);
    applyWorkspaceTheme(id);
  };

  const handleReset = () => {
    handleAccentChange(DEFAULT_ACCENT);
    handleWorkspaceChange(DEFAULT_WORKSPACE);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Theme Settings</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Customize your accent and workspace colors</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">

          {/* Accent Color */}
          <fieldset className="border border-border rounded-xl p-4 relative pt-3">
            <legend className="text-xs font-bold px-2 text-muted-foreground uppercase tracking-wide">Accent color</legend>
            <div className="grid grid-cols-8 gap-3 mt-1.5">
              {ACCENT_COLORS.map((color) => {
                const isSelected = currentAccent.toLowerCase() === color.value.toLowerCase();
                return (
                  <button
                    key={color.value}
                    onClick={() => handleAccentChange(color.value)}
                    className="group relative flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90 shadow-sm cursor-pointer border border-black/10"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {isSelected && (
                      <Check className={`h-4 w-4 stroke-[3] ${
                        ['#ffeaa7', '#fdcb6e', '#55efc4', '#81ecec', '#ff8f95'].includes(color.value.toLowerCase())
                          ? 'text-slate-900'
                          : 'text-white'
                      }`} />
                    )}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-lg transition-all group-hover:scale-100 whitespace-nowrap z-20">
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Workspace Color */}
          <fieldset className="border border-border rounded-xl p-4 relative pt-3">
            <legend className="text-xs font-bold px-2 text-muted-foreground uppercase tracking-wide">Workspace color</legend>
            <div className="grid grid-cols-4 gap-3 mt-1">
              {WORKSPACE_THEMES.map((theme) => {
                const isSelected = currentWorkspace === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleWorkspaceChange(theme.id)}
                    className={`flex flex-col items-center rounded-xl border p-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'border-border hover:border-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    <div
                      className="h-10 w-full rounded-lg shadow-inner border border-black/5 flex items-center justify-center"
                      style={{ backgroundColor: theme.bgColor }}
                    >
                      {isSelected && <Check className="h-5 w-5 text-primary stroke-[3]" />}
                    </div>
                    <span className="text-xs font-bold mt-2 text-foreground">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-1 border-t border-border flex items-center justify-between">
          <button
            onClick={handleReset}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold tracking-wide text-foreground hover:bg-muted transition duration-200 cursor-pointer uppercase"
          >
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold tracking-wide text-primary-foreground shadow-md hover:opacity-90 transition duration-200 cursor-pointer uppercase"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function Navbar({
  role = 'ADMIN',
  name = 'Alex Carter',
  email = 'admin@mkbsmart.com',
  avatarText = 'AC',
  onMenuClick,
  onSearch,
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

  const fetchNotifications = async () => {
    const session = getSession()
    if (!session || !session.token) return

    try {
      const res = await fetch(`${base}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setNotifications(data.notifications || [])
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  const handleMarkAsRead = async (id) => {
    const session = getSession()
    if (!session || !session.token) return

    try {
      const res = await fetch(`${base}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    const session = getSession()
    if (!session || !session.token) return

    try {
      const res = await fetch(`${base}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        )
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  const handleDeleteNotification = async (id) => {
    const session = getSession()
    if (!session || !session.token) return

    try {
      const res = await fetch(`${base}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const registerAdminPushToken = async () => {
    const session = getSession()
    if (!session || !session.token) return

    try {
      const mockAdminToken = `mock-fcm-admin-token-${session.isSuperAdmin ? 'super' : 'admin'}-${session.email}`
      await fetch(`${base}/api/notifications/save-admin-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ token: mockAdminToken })
      })
    } catch (err) {
      console.error('Error registering admin push token:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    registerAdminPushToken()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <>
      <header className="flex h-[70px] items-center gap-6 border-b border-border bg-card px-8 transition-colors duration-200 text-foreground">

        {/* Hamburger */}
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex shrink-0 items-center justify-center text-foreground cursor-pointer"
          aria-label="Open navigation menu"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-[22px] w-[22px]" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Search — takes most of the left space */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (typeof onSearch === 'function') {
              const formData = new FormData(event.currentTarget)
              onSearch(String(formData.get('query') || ''))
            }
          }}
          className="relative flex-1 max-w-[560px] ml-2"
        >
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M21 21L15.0001 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <input
            name="query"
            type="text"
            placeholder="Search products, orders, users..."
            className="h-[44px] w-full rounded-full border border-border bg-muted/40 pl-11 pr-6 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition duration-200"
          />
        </form>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">

          {/* Role badge */}
          <span className="rounded-full bg-muted px-4 py-[6px] text-[12px] font-semibold tracking-[0.05em] text-slate-900">
            {role}
          </span>

          {/* Appearance Settings Gear */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center text-foreground hover:text-foreground cursor-pointer transition-all duration-200"
            aria-label="Appearance settings"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative inline-flex h-10 w-10 items-center justify-center text-foreground hover:text-foreground cursor-pointer"
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M15 17H9m9-1v-4.2A6 6 0 0 0 12 6a6 6 0 0 0-6 5.8V16l-1.6 2.3A1 1 0 0 0 5.2 20h13.6a1 1 0 0 0 .8-1.7L18 16Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute right-[2px] top-[2px] flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-card animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <NotificationMenu
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDelete={handleDeleteNotification}
            />
          </div>

          {/* Avatar + name + chevron */}
          <button type="button" className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-muted cursor-pointer transition-all duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
              {avatarText}
            </div>
            <div className="text-left leading-tight">
              <div className="text-[14px] font-semibold text-foreground">{name}</div>
              <div className="text-[12px] text-muted-foreground">{email}</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-muted-foreground" aria-hidden="true">
              <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Custom Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  )
}

export default Navbar
