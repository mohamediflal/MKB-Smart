// @ts-nocheck
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

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

function ResetPwd() {
	const navigate = useNavigate()
	const location = useLocation()
	const state = location.state || {}
	const { email, otp, role } = state

	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState(null)
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		if (!email || !otp) {
			navigate('/auth/forgot-password')
		}
	}, [email, otp, navigate])

	const handleSubmit = async (event) => {
		event.preventDefault()
		setError(null)

		if (!newPassword.trim() || !confirmPassword.trim()) {
			setError('Please fill in both fields')
			return
		}
		if (newPassword !== confirmPassword) {
			setError('Passwords do not match')
			return
		}
		if (newPassword.length < 6) {
			setError('Password must be at least 6 characters long')
			return
		}

		setIsLoading(true)
		try {
			const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
			const res = await fetch(`${base}/api/auth/reset-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, otp, newPassword: newPassword.trim(), role }),
			})
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				throw new Error(data.message || 'Reset password failed')
			}
			alert('Password reset successfully! You can now log in.')
			navigate('/auth/admin')
		} catch (err) {
			setError(err?.message || 'Failed to update password')
		} finally {
			setIsLoading(false)
		}
	}

	if (!email || !otp) return null

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
								<p className="mb-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Set new password</p>
								<p className="max-w-lg text-base leading-8 text-white/80 sm:text-lg">
									Keep your administrator credentials secure. Set a new strong password below to regain dashboard access.
								</p>
							</div>
						</div>

						<p className="relative z-10 mt-8 text-sm text-white/70">© 2026 MKB-Smart. All rights reserved.</p>
					</div>
				</section>

				<section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10 bg-white">
					<div className="w-full max-w-[480px]">
						<div className="mb-8">
							<div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Set Credentials</div>
							<h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Reset Password</h1>
							<p className="mt-3 text-sm leading-7 text-slate-500">
								Resetting password for <strong className="text-slate-800">{email}</strong>.
							</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-5">
							<Field
								label="New Password"
								type="password"
								value={newPassword}
								onChange={(event) => setNewPassword(event.target.value)}
								placeholder="Enter new password"
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

							<Field
								label="Confirm New Password"
								type="password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								placeholder="Confirm new password"
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
								disabled={isLoading}
								className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-[#17813d] text-base font-semibold text-white shadow-[0_16px_30px_rgba(23,129,61,0.25)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#126732] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:-translate-y-0"
							>
								{isLoading ? (
									<>
										<svg className="mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Updating Password...
									</>
								) : (
									'Update Password'
								)}
							</button>
						</form>
					</div>
				</section>
			</div>
		</main>
	)
}

export default ResetPwd
