// @ts-nocheck
export function PageHeader({ title, subtitle, actions }) {
	return (
		<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div>
				<h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
				{subtitle ? <p className="mt-2 text-base text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
			</div>
			{actions ? <div className="flex items-center gap-2">{actions}</div> : null}
		</div>
	)
}

export function Card({ children, className = '' }) {
	return (
		<div
			className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
		>
			{children}
		</div>
	)
}

const SESSION_KEY = 'grocery_session'
const THEME_KEY = 'grocery_theme'

export async function login(email, password, role = 'admin') {
    const base = import.meta.env.VITE_BACKEND_URL || ''
    const endpoint = role === 'superadmin' ? '/api/auth/superadmin/login' : '/api/auth/admin/login'
    try {
        const res = await fetch(`${base}${endpoint}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
		})
		if (!res.ok) return null
		const data = await res.json()
		const admin = data.admin || {}
		const user = {
			name: admin.name || admin.email,
			email: admin.email,
			role: admin.isSuperAdmin ? 'super_admin' : 'admin',
			initials: (admin.name || admin.email)
				.split(' ')
				.map((s) => s[0])
				.join('')
				.slice(0, 2)
				.toUpperCase(),
			token: data.token,
			isSuperAdmin: !!admin.isSuperAdmin,
			status: admin.status === 'ACTIVE' || admin.status === 'Active' ? 'Active' : (admin.status === 'PENDING' || admin.status === 'Pending' ? 'Pending' : 'Suspended'),
		}
		if (typeof window !== 'undefined') localStorage.setItem(SESSION_KEY, JSON.stringify(user))
		return user
	} catch {
		return null
	}
}

export function logout() {
	if (typeof window !== 'undefined') localStorage.removeItem(SESSION_KEY)
}

export function getSession() {
	if (typeof window === 'undefined') return null
	try {
		const raw = localStorage.getItem(SESSION_KEY)
		return raw ? JSON.parse(raw) : null
	} catch {
		return null
	}
}

export function getTheme() {
	if (typeof window === 'undefined') return 'light'
	return localStorage.getItem(THEME_KEY) || 'light'
}

export function setTheme(t) {
	if (typeof window === 'undefined') return
	localStorage.setItem(THEME_KEY, t)
	document.documentElement.classList.toggle('dark', t === 'dark')
}

function getStoredItem(key, fallback) {
	if (typeof window === 'undefined') return fallback
	try {
		const data = localStorage.getItem(key)
		return data ? JSON.parse(data) : fallback
	} catch {
		return fallback
	}
}

function setStoredItem(key, val) {
	if (typeof window !== 'undefined') {
		localStorage.setItem(key, JSON.stringify(val))
	}
}

const CATEGORIES = ['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Meat', 'Beverages', 'Staples', 'Household']
const CATEGORY_EMOJIS = {
	'Fruits': '🍎',
	'Vegetables': '🥦',
	'Dairy': '🥛',
	'Bakery': '🥖',
	'Meat': '🥩',
	'Beverages': '🧃',
	'Staples': '🌾',
	'Household': '🧼'
}

const initialProducts = [
	{ id: 'p-0', sku: 'SKU-1000', name: 'Fresh Whole Chicken (Bulk)', emoji: '🍗', category: 'Meat', unit: 'kg', stock: 1200, price: 1405.00, active: true },
	{ id: 'p-1', sku: 'SKU-1001', name: 'Luulu Badabath Broken Rice 5kg', emoji: '🌾', category: 'Staples', unit: 'pcs', stock: 850, price: 1200.00, active: true },
	{ id: 'p-2', sku: 'SKU-1002', name: 'Anchor Cream Milk Powder 800g', emoji: '🥛', category: 'Dairy', unit: 'pcs', stock: 1100, price: 2800.00, active: true },
	{ id: 'p-3', sku: 'SKU-1003', name: 'Tomatoes (per portion)', emoji: '🍅', category: 'Vegetables', unit: 'kg', stock: 950, price: 570.00, active: true },
	{ id: 'p-4', sku: 'SKU-1004', name: 'Scraped Coconut (per pack)', emoji: '🥥', category: 'Vegetables', unit: 'pcs', stock: 500, price: 230.00, active: true },
	{ id: 'p-5', sku: 'SKU-1005', name: 'Single Coconut', emoji: '🥥', category: 'Vegetables', unit: 'pcs', stock: 1400, price: 160.00, active: true },
	{ id: 'p-6', sku: 'SKU-1006', name: 'Highland Pasteurised Milk 450ml', emoji: '🥛', category: 'Dairy', unit: 'pcs', stock: 750, price: 200.00, active: true },
	{ id: 'p-7', sku: 'SKU-1007', name: 'Kotmale Fresh Milk 400ml', emoji: '🥛', category: 'Dairy', unit: 'pcs', stock: 1250, price: 180.00, active: true },
	{ id: 'p-8', sku: 'SKU-1008', name: 'Anchor Newdale Set Yoghurt 80g', emoji: '🥛', category: 'Dairy', unit: 'pcs', stock: 3400, price: 80.00, active: true },
	{ id: 'p-9', sku: 'SKU-1009', name: 'Lipton Yellow Label Tea 180g', emoji: '🧃', category: 'Beverages', unit: 'pcs', stock: 1150, price: 725.00, active: true },
	{ id: 'p-10', sku: 'SKU-1010', name: 'Tide Matic Detergent 850ml', emoji: '🧼', category: 'Household', unit: 'pcs', stock: 900, price: 950.00, active: true },
	{ id: 'p-11', sku: 'SKU-1011', name: 'Munchee Super Cream Crackers 490g', emoji: '🍪', category: 'Bakery', unit: 'pcs', stock: 1500, price: 540.00, active: true },
	{ id: 'p-12', sku: 'SKU-1012', name: 'Sunlight Washing Soap 115g', emoji: '🧼', category: 'Household', unit: 'pcs', stock: 2400, price: 160.00, active: true },
	{ id: 'p-13', sku: 'SKU-1013', name: 'Harischandra Coffee 200g', emoji: '☕', category: 'Beverages', unit: 'pcs', stock: 800, price: 680.00, active: true },
	{ id: 'p-14', sku: 'SKU-1014', name: 'Red Raw Rice 5kg', emoji: '🌾', category: 'Staples', unit: 'pcs', stock: 1800, price: 1150.00, active: true },
	{ id: 'p-15', sku: 'SKU-1015', name: 'White Sugar 1kg', emoji: '🍬', category: 'Staples', unit: 'pcs', stock: 3500, price: 280.00, active: true },
	{ id: 'p-16', sku: 'SKU-1016', name: 'Onions 1kg', emoji: '🧅', category: 'Vegetables', unit: 'kg', stock: 2000, price: 420.00, active: true },
	{ id: 'p-17', sku: 'SKU-1017', name: 'Potatoes 1kg', emoji: '🥔', category: 'Vegetables', unit: 'kg', stock: 2200, price: 340.00, active: true },
	{ id: 'p-18', sku: 'SKU-1018', name: 'Fresh Apples 1kg', emoji: '🍎', category: 'Fruits', unit: 'kg', stock: 650, price: 980.00, active: true },
	{ id: 'p-19', sku: 'SKU-1019', name: 'Fresh Bananas 1kg', emoji: '🍌', category: 'Fruits', unit: 'kg', stock: 1100, price: 450.00, active: true },
	{ id: 'p-20', sku: 'SKU-1020', name: 'Anchor Butter 200g', emoji: '🧈', category: 'Dairy', unit: 'pcs', stock: 1300, price: 1250.00, active: true }
]

export const products = getStoredItem('grocery_products_mkb_v4', initialProducts)

export function addProduct(p) {
	const newProduct = {
		id: `p-${Date.now()}`,
		sku: p.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
		active: true,
		...p,
	}
	products.unshift(newProduct)
	setStoredItem('grocery_products_mkb_v4', products)
	return newProduct
}

const initialCategories = CATEGORIES.map((c, i) => ({
	id: `c-${i}`,
	name: c,
	emoji: CATEGORY_EMOJIS[c] || '📦',
	productCount: products.filter((p) => p.category === c).length,
	revenue: Math.round(1200000 + Math.random() * 1800000),
}))

export const categories = getStoredItem('grocery_categories_mkb_v4', initialCategories)

export function addCategory(c) {
	const newCategory = {
		id: `c-${Date.now()}`,
		productCount: 0,
		revenue: 0,
		...c,
	}
	categories.push(newCategory)
	setStoredItem('grocery_categories_mkb_v4', categories)
	return newCategory
}

const CUSTOMERS = [
	'Emma Johnson',
	'Liam Williams',
	'Olivia Brown',
	'Noah Davis',
	'Ava Wilson',
	'Mason Garcia',
	'Sophia Martinez',
	'Lucas Anderson',
	'Mia Thomas',
	'Ethan Moore',
]
const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

const initialOrders = Array.from({ length: 32 }).map((_, i) => {
	const d = new Date()
	d.setDate(d.getDate() - i)
	const paymentMethods = ['Card', 'Cash', 'Wallet']
	const amounts = [3580.00, 5200.00, 4120.00, 6800.00, 3950.00, 5750.00, 4800.00, 6240.00, 3600.00, 7150.00]
	return {
		id: `#ORD-${10234 + i}`,
		customer: CUSTOMERS[i % CUSTOMERS.length],
		amount: amounts[i % amounts.length],
		status: STATUSES[i % STATUSES.length],
		date: d.toISOString().slice(0, 10),
		items: 2 + (i % 5),
		payment: paymentMethods[i % paymentMethods.length],
	}
})

const rawOrders = getStoredItem('grocery_orders_mkb_v4', initialOrders)
const paymentMethodsForMapping = ['Card', 'Cash', 'Wallet']
export const orders = rawOrders.map((o, i) => ({
	payment: o.payment || paymentMethodsForMapping[i % paymentMethodsForMapping.length],
	...o,
}))

export function addOrder(o) {
	const newOrder = {
		id: `#ORD-${Math.floor(10000 + Math.random() * 90000)}`,
		date: new Date().toISOString().slice(0, 10),
		items: 1,
		status: 'Pending',
		payment: ['Card', 'Cash', 'Wallet'][Math.floor(Math.random() * 3)],
		...o,
	}
	orders.unshift(newOrder)
	setStoredItem('grocery_orders_mkb_v4', orders)
	return newOrder
}

const initialUsers = Array.from({ length: 24 }).map((_, i) => ({
	id: `u-${i}`,
	name: CUSTOMERS[i % CUSTOMERS.length] + (i >= CUSTOMERS.length ? ` ${Math.floor(i / CUSTOMERS.length) + 1}` : ''),
	email: CUSTOMERS[i % CUSTOMERS.length].toLowerCase().replace(' ', '.') + (i >= CUSTOMERS.length ? i : '') + '@mail.com',
	orders: 5 + ((i * 3) % 45),
	spent: Number((850 + i * 152.05).toFixed(2)),
	joined: `2025-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 27)).padStart(2, '0')}`,
	status: i % 5 === 0 ? 'Inactive' : 'Active',
}))

export const users = getStoredItem('grocery_users_mkb_v5', initialUsers)

export function addUser(u) {
	const newUser = {
		id: `u-${Date.now()}`,
		joined: new Date().toISOString().slice(0, 10),
		orders: 0,
		spent: 0,
		status: 'Active',
		...u,
	}
	users.unshift(newUser)
	setStoredItem('grocery_users_mkb_v5', users)
	return newUser
}

const initialAdmins = [
	{ id: 'a-1', name: 'Alex Carter', email: 'admin@mkbsmart.com', role: 'admin', lastActive: '2026-05-26 09:12', status: 'Active' },
	{ id: 'a-2', name: 'Jordan Reyes', email: 'super@mkbsmart.com', role: 'super_admin', lastActive: '2026-05-27 08:01', status: 'Active' },
	{ id: 'a-3', name: 'Priya Shah', email: 'priya@mkbsmart.com', role: 'admin', lastActive: '2026-05-25 14:55', status: 'Active' },
	{ id: 'a-4', name: 'Marcus Lee', email: 'marcus@mkbsmart.com', role: 'admin', lastActive: '2026-05-20 11:33', status: 'Inactive' },
]

export const admins = getStoredItem('grocery_admins_v2', initialAdmins)

export async function addAdmin(a) {
    const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/auth/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: a.name, email: a.email, password: a.password }),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Admin registration failed')
    }

    const data = await res.json()
    const admin = data.admin || {}
    const newAdmin = {
        id: admin.id || `a-${Date.now()}`,
        lastActive: new Date().toISOString().slice(0, 16).replace('T', ' '),
        status: 'Active',
        name: admin.name || a.name,
        email: admin.email || a.email,
        role: admin.isSuperAdmin ? 'super_admin' : 'admin',
    }
    admins.push(newAdmin)
    setStoredItem('grocery_admins_v2', admins)
    return newAdmin
}

export const weeklySales = [
	{ name: 'Mon', value: 42000 },
	{ name: 'Tue', value: 51000 },
	{ name: 'Wed', value: 48000 },
	{ name: 'Thu', value: 56000 },
	{ name: 'Fri', value: 64000 },
	{ name: 'Sat', value: 78000 },
	{ name: 'Sun', value: 71000 },
]

export const monthlySales = Array.from({ length: 12 }).map((_, i) => ({
	name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
	value: Math.round(1100000 + Math.random() * 900000),
}))

export const categoryRevenue = [
	{ name: 'Fruits', value: 15 },
	{ name: 'Vegetables', value: 18 },
	{ name: 'Dairy', value: 22 },
	{ name: 'Bakery', value: 10 },
	{ name: 'Meat', value: 12 },
	{ name: 'Beverages', value: 8 },
	{ name: 'Staples', value: 10 },
	{ name: 'Household', value: 5 },
]

export const activityLogs = Array.from({ length: 20 }).map((_, i) => {
	const actions = [
		'logged in',
		'updated product',
		'created order',
		'cancelled order',
		'added admin',
		'changed price',
		'deleted category',
		'exported report',
		'updated profile',
		'changed settings',
	]
	const d = new Date()
	d.setHours(d.getHours() - i * 2)
	return {
		id: `log-${i}`,
		user: i % 2 === 0 ? 'Jordan Reyes' : 'Alex Carter',
		action: actions[i % actions.length],
		target: i % 3 === 0 ? (products[i % products.length] ? products[i % products.length].name : '—') : '—',
		time: d.toLocaleString(),
	}
})

export function statusColor(s) {
	return (
		{
			Placed: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
			Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
			Processing: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
			Shipped: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
			Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
			Cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
		}[s] || 'bg-muted text-muted-foreground'
	)
}

function RoleCard({ title, description, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="group relative overflow-hidden rounded-3xl border border-emerald-100/90 bg-white/95 p-7 text-left shadow-[0_14px_34px_rgba(5,150,105,0.08)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-[0_24px_54px_rgba(16,185,129,0.2)]"
		>
			<div className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">{title}</div>
			<p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
			<div className="mt-7 inline-flex items-center text-sm font-semibold text-emerald-900 transition group-hover:text-emerald-700">
				Continue
			</div>
		</button>
	)
}

function IndexPage({ onSelectRole }) {
	return (
		<main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_transparent_42%),linear-gradient(180deg,#ecfdf5_0%,#f0fdf4_52%,#d1fae5_100%)] px-6 py-10 text-slate-900 sm:px-10 lg:px-16">
			<div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center">
				<div className="max-w-3xl">
					<div className="uppercase text-emerald-700">
						<span className="block text-4xl font-extrabold tracking-[0.12em] sm:text-5xl">MKB-SMART</span>
						<span className="mt-2 block text-sm font-semibold tracking-[0.34em] text-emerald-700/80">Admin Portal</span>
					</div>
					<h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
						Choose how you want to continue.
					</h1>
					<p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
						Pick Admin if you manage products, inventory, and orders. Pick Super Admin if you manage the full platform.
					</p>
				</div>

				<div className="mt-12 grid gap-6 md:grid-cols-2">
					<RoleCard
						title="Admin"
						description="Use the Admin login screen to sign in or switch to register a new admin account."
						onClick={() => onSelectRole?.('admin')}
					/>
					<RoleCard
						title="Super Admin"
						description="Use the Super Admin login screen to access elevated platform controls."
						onClick={() => onSelectRole?.('superadmin')}
					/>
				</div>
			</div>
		</main>
	)
}

export default IndexPage

