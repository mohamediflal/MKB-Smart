// @ts-nocheck
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../index'

function Icon({ children, className = '' }) {
	return (
		<span
			className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white ${className}`}
			aria-hidden="true"
		>
			{children}
		</span>
	)
}

function Field({ label, type, value, onChange, placeholder, icon, rightSlot, endIcon }) {
	return (
		<label className="block">
			<div className="mb-2 flex items-center justify-between gap-3">
				<span className="text-sm font-semibold text-slate-800">{label}</span>
				{rightSlot}
			</div>
			<div className="relative">
				<span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">{icon}</span>
				<input
					type={type}
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					className={`h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 ${endIcon ? 'pr-12' : 'pr-4'} text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10`}
				/>
				{endIcon && <span className="absolute inset-y-0 right-4 flex items-center">{endIcon}</span>}
			</div>
		</label>
	)
}

function Login({ role = 'admin', mode = 'login', onModeChange, onBack, onLogin }) {
	const navigate = useNavigate()

	const handleBack = () => {
		if (typeof onBack === 'function') {
			onBack()
			return
		}
		navigate('/')
	}

	const isAdmin = role === 'admin'
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [rememberMe, setRememberMe] = useState(true)
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState(null)

	const heading = 'Sign in to your account'
	const subheading = 'Enter your credentials to access the admin console.'

	const handleSubmit = async (event) => {
		event.preventDefault()
		setError(null)
		try {
			const u = await login(email, password, role)
			if (!u) {
				setError('Invalid email or password')
				return
			}
			onLogin?.(u)
		} catch (err) {
			const errMsg = err?.message || 'Login failed'
			if (errMsg.toLowerCase().includes('suspended')) {
				alert(errMsg)
			}
			setError(errMsg)
		}
	}

	return (
		<main className="min-h-screen bg-white text-slate-900">
			<div className="grid min-h-screen lg:grid-cols-2">
				<section className="relative overflow-hidden bg-[linear-gradient(160deg,#15803d_0%,#0f7a39_46%,#166534_100%)] px-8 py-8 text-white sm:px-12 lg:px-14 lg:py-10">
					<div className="relative flex h-full flex-col">
						<div className="flex items-center gap-3">
							<Icon>
								<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
									<path d="M7 17c6.5 0 10-3.5 10-10-6.5 0-10 3.5-10 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
									<path d="M7.5 16.5C6.3 14.8 6 12.4 6 10.5 6 8 7 5.8 8.8 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
								</svg>
							</Icon>
							<span className="text-xl font-semibold tracking-tight">MKB-Smart</span>
						</div>

						<div className="flex flex-1 items-center">
							<div className="max-w-xl py-12 lg:py-0">
								<p className="mb-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Fresh groceries, managed beautifully.</p>
								<p className="max-w-lg text-base leading-8 text-white/80 sm:text-lg">
									Manage products, inventory, orders and customers — all from one premium admin console.
								</p>
								<div className="mt-12 grid max-w-xl grid-cols-3 gap-4 sm:gap-8">
									{[
										['12k+', 'PRODUCTS'],
										['48k', 'ORDERS'],
										['9.8k', 'CUSTOMERS'],
									].map(([value, label]) => (
										<div key={label} className="rounded-3xl bg-white/0">
											<div className="text-2xl font-semibold sm:text-3xl">{value}</div>
											<div className="mt-1 text-xs font-medium uppercase tracking-[0.26em] text-white/70">{label}</div>
										</div>
									))}
								</div>
							</div>
						</div>

						<p className="relative z-10 mt-8 text-sm text-white/70">© 2026 MKB-Smart. All rights reserved.</p>
					</div>
				</section>

				<section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10 bg-white">
					<div className="w-full max-w-[480px]">
						<div className="mb-8">
							<h1 className="text-3xl font-semibold tracking-tight text-slate-900">{heading}</h1>
							<p className="mt-3 text-sm leading-7 text-slate-500">{subheading}</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-5">
							<Field
								label="Email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="you@mkbsmart.com"
								icon={
									<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
										<path d="M4 7.5h16v9H4v-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
										<path d="m4.5 8 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								}
							/>

							<Field
								label="Password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								placeholder="Enter your password"
								icon={
									<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
										<path d="M7 11V8.8A5 5 0 0 1 12 4a5 5 0 0 1 5 4.8V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
										<rect x="5" y="11" width="14" height="8" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
									</svg>
								}
								rightSlot={
									<button
										type="button"
										onClick={() => navigate('/auth/forgot-password')}
										className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800 bg-transparent border-0 outline-none cursor-pointer"
									>
										Forgot password?
									</button>
								}
								endIcon={
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-0 cursor-pointer p-1"
									>
										{showPassword ? (
											<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
												<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
												<path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
											</svg>
										) : (
											<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
												<path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
											</svg>
										)}
									</button>
								}
							/>

							<label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
								<div className="relative flex items-center justify-center">
									<input
										type="checkbox"
										checked={rememberMe}
										onChange={(event) => setRememberMe(event.target.checked)}
										className="peer sr-only"
									/>
									<div className="h-5 w-5 rounded-full border-2 border-slate-300 bg-white transition peer-checked:border-[#17813d] peer-checked:bg-[#17813d]"></div>
									{rememberMe && (
										<svg className="absolute w-3 h-3 text-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
											<path d="M5 13l4 4L19 7" />
										</svg>
									)}
								</div>
								<span>Remember me for 30 days</span>
							</label>

							{error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

							<button
								type="submit"
								className="mt-2 h-14 w-full rounded-2xl bg-[#17813d] text-base font-semibold text-white transition duration-200 hover:bg-[#126732]"
							>
								Sign in
							</button>
						</form>
						{isAdmin && (
							<div className="mt-4 text-center text-sm text-slate-500">
								<span>Don't have an account?</span>{' '}
								<button
									type="button"
									onClick={() => navigate('/auth/admin/signup')}
									className="font-semibold text-emerald-700 hover:text-emerald-800 bg-transparent border-0 outline-none cursor-pointer"
								>
									Create account
								</button>
							</div>
						)}				</div>				</section>
			</div>
		</main>
	)
}

export default Login
