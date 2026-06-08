// @ts-nocheck
import { useState } from 'react'
import { addAdmin } from '../index'

function Field({ label, type, value, onChange, placeholder, icon }) {
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
					className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
				/>
			</div>
		</label>
	)
}

function SignUp({ onModeChange }) {
	const [fullName, setFullName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState(null)

	const handleSubmit = async (event) => {
		event.preventDefault()
		setError(null)
		if (password !== confirmPassword) {
			setError('Passwords do not match')
			return
		}
		try {
			await addAdmin({ name: fullName, email: email, role: 'admin', password })
			alert('Admin account registered successfully! You can now log in.')
			onModeChange('login')
		} catch (err) {
			setError(err?.message || 'Registration failed')
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
							type="password"
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
						/>
					</div>

					<Field
						label="Confirm password"
						type="password"
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
					/>

					{error && <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

					<button
						type="submit"
						className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-base font-semibold text-white shadow-[0_15px_30px_rgba(23,129,61,0.18)] transition duration-200 hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
					>
						Create admin account
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

