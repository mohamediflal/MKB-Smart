// @ts-nocheck
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

function ForgotPassword() {
	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [error, setError] = useState(null)
	const [isLoading, setIsLoading] = useState(false)

	const handleSubmit = async (event) => {
		event.preventDefault()
		if (!email) return

		setIsLoading(true)
		setError(null)
		try {
			const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
			const res = await fetch(`${base}/api/auth/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), role: 'admin' }),
			})
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				throw new Error(data.message || 'Failed to send OTP')
			}
			navigate('/auth/admin/otp', { state: { email: email.trim(), mode: 'forgot', role: 'admin' } })
		} catch (err) {
			setError(err?.message || 'Failed to send verification code')
		} finally {
			setIsLoading(false)
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
									Manage products, inventory, orders and customers from one premium admin console built for busy teams.
								</p>
							</div>
						</div>

						<p className="relative z-10 mt-8 text-sm text-white/70">© 2026 MKB-Smart. All rights reserved.</p>
					</div>
				</section>

				<section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10 bg-white">
					<div className="w-full max-w-[480px]">
						<button
							type="button"
							onClick={() => navigate('/auth/admin')}
							className="-ml-2 mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
						>
							<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
								<path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							<span>Back to login</span>
						</button>

						<div className="mb-8">
							<div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Account Recovery</div>
							<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Forgot Password</h1>
							<p className="mt-3 text-sm leading-7 text-slate-500">
								Enter your email address and we will send you a 6-digit OTP verification code to reset your password.
							</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-5">
							<label className="block">
								<div className="mb-2 text-sm font-semibold text-slate-800">Email</div>
								<div className="relative">
									<span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
										<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
											<path d="M4 7.5h16v9H4v-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
											<path d="m4.5 8 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</span>
									<input
										type="email"
										required
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										placeholder="you@mkbsmart.com"
										className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
									/>
								</div>
							</label>

							{error && <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

							<button
								type="submit"
								disabled={isLoading}
								className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-[#17813d] text-base font-semibold text-white shadow-[0_16px_30px_rgba(23,129,61,0.25)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#126732] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:-translate-y-0"
							>
								{isLoading ? (
									<>
										<svg className="mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Sending OTP...
									</>
								) : (
									'Send OTP Code'
								)}
							</button>
						</form>

					</div>
				</section>
			</div>
		</main>
	)
}

export default ForgotPassword

