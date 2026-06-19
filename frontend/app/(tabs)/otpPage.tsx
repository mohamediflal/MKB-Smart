import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Image,
	Pressable,
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router'
import { useAuth } from '@/context/AuthContext'

export default function OtpPage() {
	const [otp, setOtp] = useState('')
	const [loading, setLoading] = useState(false)
	const [resending, setResending] = useState(false)
	const [timer, setTimer] = useState(60)
	const router = useRouter()
	const navigation = useNavigation()

	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			setTimer(60)
		})
		return unsubscribe
	}, [navigation])

	useEffect(() => {
		if (timer <= 0) return
		const interval = setInterval(() => {
			setTimer((prev) => prev - 1)
		}, 1000)
		return () => clearInterval(interval)
	}, [timer])
	const params = useLocalSearchParams<{
		name?: string;
		email?: string;
		phone?: string;
		password?: string;
		returnTo?: string;
		mode?: 'forgot' | 'register';
	}>()
	const { register, sendOtp, verifyForgotOtp, forgotPassword } = useAuth()

	const onVerify = async () => {
		const otpCode = otp.trim()
		if (!otpCode) {
			Alert.alert('Please enter the verification code.')
			return
		}

		if (otpCode.length !== 6) {
			Alert.alert('OTP must be a 6-digit code.')
			return
		}

		setLoading(true)
		try {
			if (params.mode === 'forgot') {
				await verifyForgotOtp(params.email || '', otpCode)
				Alert.alert('OTP Verified', 'Verification successful! Set your new password now.', [
					{
						text: 'OK',
						onPress: () => {
							router.push({
								pathname: '/resetPwd',
								params: {
									email: params.email || '',
									otp: otpCode,
								}
							})
						}
					}
				])
			} else {
				await register({
					name: params.name || '',
					email: params.email || '',
					phone: params.phone || '',
					password: params.password || '',
					otp: otpCode,
				})
				Alert.alert('Account Verified', 'Your account has been created successfully!', [
					{
						text: 'OK',
						onPress: () => {
							const destination = params.returnTo ?? '/profile'
							router.replace(destination)
						}
					}
				])
			}
		} catch (error) {
			Alert.alert('Verification failed', error instanceof Error ? error.message : 'Please check the OTP and try again.')
		} finally {
			setLoading(false)
		}
	}

	const onResend = async () => {
		if (timer > 0) return
		if (!params.email) {
			Alert.alert('Email address is missing.')
			return
		}

		setResending(true)
		try {
			if (params.mode === 'forgot') {
				await forgotPassword(params.email)
			} else {
				await sendOtp(params.email)
			}
			Alert.alert('OTP Resent', 'A new verification code has been sent to your email.')
			setTimer(60)
		} catch (error) {
			Alert.alert('Resend failed', error instanceof Error ? error.message : 'Please try again.')
		} finally {
			setResending(false)
		}
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={{ flex: 1, backgroundColor: '#f3fcf1' }}
		>
			<TouchableOpacity
				onPress={() => {
					if (router.canGoBack()) {
						router.back()
					} else {
						router.replace('/login')
					}
				}}
				style={{
					position: 'absolute',
					top: Platform.OS === 'ios' ? 50 : 20,
					left: 16,
					width: 40,
					height: 40,
					borderRadius: 20,
					backgroundColor: '#ffffff',
					alignItems: 'center',
					justifyContent: 'center',
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 4,
					elevation: 3,
					zIndex: 99,
				}}
				accessibilityRole="button"
				accessibilityLabel="Go back"
			>
				<Ionicons name="arrow-back" size={24} color="#006d37" />
			</TouchableOpacity>
			<ScrollView contentContainerStyle={{ padding: 20, paddingTop: Platform.OS === 'ios' ? 100 : 70, paddingBottom: 80, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
				<View style={{ alignItems: 'center', marginBottom: 20 }}>
					<Image
						source={{
							uri: 'https://lh3.googleusercontent.com/aida/AP1WRLuFlM0lqeS7jhzlrOAtJ8tT-uRX35DFMAv4BOGDTq7YSMLJ4quBgtCpYBlSWQzmF45L9N6c3k9GVMR-U3mg4noAJ0ep5jTyfqa-nIFMymClq1wQb57ZCOZSQdV0Y4Zh7YIVILRiaEPbHAMNelRs5DcjvWhKgw01E6eXVKc7Svfu7DRvFe1xuoeaO3Tu2I0I2-d4cIpVGE5zUtvoCnqxAuLXXpi8KkQ8IPI8vOFECQ9agFgv2UGUo2ShLA',
						}}
						style={{ width: 150, height: 150, resizeMode: 'contain', borderRadius: 16 }}
					/>
				</View>

				<View style={{ alignItems: 'center', marginBottom: 24 }}>
					<Text style={{ fontSize: 24, fontWeight: '700', color: '#161d17' }}>Verify Email</Text>
					<Text style={{ color: '#3d4a3e', marginTop: 10, textAlign: 'center', maxWidth: 300, lineHeight: 20 }}>
						We have sent a 6-digit verification code to {'\n'}
						<Text style={{ fontWeight: '700', color: '#006d37' }}>{params.email}</Text>
					</Text>
				</View>

				<View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
					{/* OTP Input */}
					<Text style={{ color: '#556', marginBottom: 10, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
						Enter Verification Code
					</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6eb', borderRadius: 12, paddingHorizontal: 16, height: 54, marginBottom: 20 }}>
						<Text style={{ marginRight: 10, fontSize: 20 }}>🔑</Text>
						<TextInput
							placeholder="e.g. 123456"
							keyboardType="number-pad"
							maxLength={6}
							autoFocus
							value={otp}
							onChangeText={setOtp}
							style={{ flex: 1, fontSize: 18, fontWeight: 'bold', color: '#161d17', letterSpacing: 2 }}
						/>
					</View>

					{/* Verify Button */}
					<TouchableOpacity
						onPress={onVerify}
						disabled={loading}
						style={{ height: 56, borderRadius: 999, backgroundColor: '#006d37', alignItems: 'center', justifyContent: 'center', shadowColor: '#006d37', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
								{params.mode === 'forgot' ? 'Verify Code' : 'Verify & Create Account'}
							</Text>
						)}
					</TouchableOpacity>

					{/* Resend Link */}
					<View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
						{resending ? (
							<ActivityIndicator size="small" color="#006d37" />
						) : (
							<Pressable disabled={timer > 0} onPress={onResend}>
								<Text style={{ color: '#006d37', fontWeight: '700', opacity: timer > 0 ? 0.5 : 1 }}>
									{timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
								</Text>
							</Pressable>
						)}
					</View>
				</View>

				<View style={{ alignItems: 'center', marginTop: 30 }}>
					<Pressable onPress={() => router.back()}>
						<Text style={{ color: '#65735e', fontWeight: '600', textDecorationLine: 'underline' }}>
							{params.mode === 'forgot' ? 'Back to Forgot Password' : 'Back to Registration'}
						</Text>
					</Pressable>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}
