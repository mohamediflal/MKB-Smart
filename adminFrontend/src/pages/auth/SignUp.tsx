// @ts-nocheck
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { addAdmin } from '../index'
import { getApiBase } from '../../config/api'

function Field({ label, type, value, onChange, placeholder, icon, endIcon }) {
	return (
		<label className="block">
			<div className="mb-2 text-sm font-semibold text-slate-800">{label}</div>
			<div className="relative">
				<span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
					{icon}
				</span>
				<input
					type={type}
					required
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					className={`h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 ${endIcon ? 'pr-12' : 'pr-4'} text-sm text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10`}
				/>
				{endIcon && <span className="absolute inset-y-0 right-4 flex items-center">{endIcon}</span>}
			</div>
		</label>
	)
}

function SignUp({ onModeChange }) {
	const navigate = useNavigate()
	const [fullName, setFullName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [error, setError] = useState(null)
	const [isLoading, setIsLoading] = useState(false)

	const handleSubmit = async (event) => {
		event.preventDefault()
		setError(null)
		if (password.length <= 8) {
			setError('Password must be more than 8 characters.')
			return
		}
		if (password !== confirmPassword) {
			setError('Passwords do not match')
			return
		}
		setIsLoading(true)
		try {
			const base = getApiBase()
			const res = await fetch(`${base}/api/auth/send-otp`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim() }),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok) {
				throw new Error(data.message || 'Failed to send verification code')
			}
			navigate('/auth/admin/otp', { state: { name: fullName.trim(), email: email.trim(), password } })
		} catch (err) {
			const msg = err?.message || ''
			if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
				setError('Unable to reach the server. Please check your connection or backend service.')
			} else {
				setError(msg || 'Registration failed')
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-12">
				<div className="space-y-3 text-center">
					<p className="inline-flex rounded-full bg-emerald-50 px-4 py-1 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-700 shadow-sm">
						Admin Signup
					</p>
					<h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Create your admin account</h1>
					<p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
						Quickly set up administrator access to manage products, inventory and orders from the dashboard.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">
					<Field
						label="Full name"
						type="text"
						value={fullName}
						onChange={(event) => setFullName(event.target.value)}
						placeholder="Enter your full name"
						icon={
							<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
								<path
									d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
									stroke="currentColor"
									strokeWidth="1.8"
								/>
								<path
									d="M5 19c1.6-3 4.1-4.5 7-4.5s5.4 1.5 7 4.5"
									stroke="currentColor"
									strokeWidth="1.8"
									strokeLinecap="round"
								/>
							</svg>
						}
					/>

					<div className="grid gap-5 md:grid-cols-2">
						<Field
							label="Email"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="you@mkbsmart.com"
							icon={
								<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
									<path
										d="M4 7.5h16v9H4v-9Z"
										stroke="currentColor"
										strokeWidth="1.8"
										strokeLinejoin="round"
									/>
									<path
										d="m4.5 8 7.5 6 7.5-6"
										stroke="currentColor"
										strokeWidth="1.8"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							}
						/>

						<Field
							label="Password"
							type={showPassword ? 'text' : 'password'}
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="Create a password"
							icon={
								<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
									<path
										d="M7 11V8.8A5 5 0 0 1 12 4a5 5 0 0 1 5 4.8V11"
										stroke="currentColor"
										strokeWidth="1.8"
										strokeLinecap="round"
									/>
									<rect
										x="5"
										y="11"
										width="14"
										height="8"
										rx="2.2"
										stroke="currentColor"
										strokeWidth="1.8"
									/>
								</svg>
							}
							endIcon={
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-0 cursor-pointer p-1 transition-colors"
									aria-label={showPassword ? 'Hide password' : 'Show password'}
									title={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							}
						/>
					</div>

					<Field
						label="Confirm password"
						type={showConfirmPassword ? 'text' : 'password'}
						value={confirmPassword}
						onChange={(event) => setConfirmPassword(event.target.value)}
						placeholder="Re-enter your password"
						icon={
							<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
								<path
									d="M7 11V8.8A5 5 0 0 1 12 4a5 5 0 0 1 5 4.8V11"
									stroke="currentColor"
									strokeWidth="1.8"
									strokeLinecap="round"
								/>
								<rect
									x="5"
									y="11"
									width="14"
									height="8"
									rx="2.2"
									stroke="currentColor"
									strokeWidth="1.8"
								/>
							</svg>
						}
						endIcon={
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-0 cursor-pointer p-1 transition-colors"
								aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
								title={showConfirmPassword ? 'Hide password' : 'Show password'}
							>
								{showConfirmPassword ? (
									<EyeOff className="h-5 w-5" />
								) : (
									<Eye className="h-5 w-5" />
								)}
							</button>
						}
					/>

					{error && <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

					<button
						type="submit"
						disabled={isLoading}
						className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-base font-semibold text-white shadow-[0_15px_30px_rgba(23,129,61,0.18)] transition duration-200 hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-80 disabled:cursor-not-allowed"
					>
						{isLoading ? (
							<>
								<svg className="mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Sending Verification Code...
							</>
						) : (
							'Create admin account'
						)}
					</button>
				</form>

				<div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600 shadow-sm">
					<span>Already have an account? </span>
					<button
						type="button"
						onClick={() => onModeChange('login')}
						className="font-semibold text-emerald-700 hover:text-emerald-800 transition-colors duration-200"
					>
						Back to login
					</button>
				</div>
			</div>
		</main>
	)
}

export default SignUp

