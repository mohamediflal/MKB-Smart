import React, { useState } from 'react'
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
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'

export default function Register() {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [terms, setTerms] = useState(false)
	const [loading, setLoading] = useState(false)
	const router = useRouter()
	const params = useLocalSearchParams<{ returnTo?: string }>()
	const { sendOtp } = useAuth()

	const onSubmit = async () => {
		if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
			Alert.alert('Please complete all required fields.')
			return
		}

		if (password !== confirmPassword) {
			Alert.alert('Passwords do not match.')
			return
		}

		if (!terms) {
			Alert.alert('Please accept the Terms and Conditions')
			return
		}

		setLoading(true)
		try {
			await sendOtp(email.trim())
			router.push({
				pathname: '/otpPage',
				params: {
					name: name.trim(),
					email: email.trim(),
					phone: phone.trim(),
					password,
					returnTo: params.returnTo,
				}
			})
		} catch (error) {
			Alert.alert('Registration failed', error instanceof Error ? error.message : 'Please try again.')
		} finally {
			setLoading(false)
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
			<ScrollView contentContainerStyle={{ padding: 20, paddingTop: Platform.OS === 'ios' ? 100 : 70, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
				<View style={{ alignItems: 'center', marginBottom: 16 }}>
					<Image
						source={{
							uri: 'https://lh3.googleusercontent.com/aida/AP1WRLuFlM0lqeS7jhzlrOAtJ8tT-uRX35DFMAv4BOGDTq7YSMLJ4quBgtCpYBlSWQzmF45L9N6c3k9GVMR-U3mg4noAJ0ep5jTyfqa-nIFMymClq1wQb57ZCOZSQdV0Y4Zh7YIVILRiaEPbHAMNelRs5DcjvWhKgw01E6eXVKc7Svfu7DRvFe1xuoeaO3Tu2I0I2-d4cIpVGE5zUtvoCnqxAuLXXpi8KkQ8IPI8vOFECQ9agFgv2UGUo2ShLA',
						}}
						style={{ width: 220, height: 220, resizeMode: 'contain', borderRadius: 16 }}
					/>
				</View>

				<View style={{ alignItems: 'center', marginBottom: 8 }}>
					<Text style={{ fontSize: 20, fontWeight: '700', color: '#006d37' }}>MKB-Smart</Text>
				</View>

				<View style={{ alignItems: 'center', marginBottom: 14 }}>
					<Text style={{ fontSize: 22, fontWeight: '700', color: '#161d17' }}>Create Account</Text>
					<Text style={{ color: '#3d4a3e', marginTop: 6, textAlign: 'center', maxWidth: 300 }}>
						Sign up to start shopping fresh groceries delivered to your door
					</Text>
				</View>

				<View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
					{/* Full Name */}
					<Text style={{ color: '#556', marginBottom: 6, fontSize: 12 }}>Full Name</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6eb', borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 10 }}>
						<Text style={{ marginRight: 8 }}>👤</Text>
						<TextInput placeholder="Enter your full name" value={name} onChangeText={setName} style={{ flex: 1 }} />
					</View>

					{/* Email */}
					<Text style={{ color: '#556', marginBottom: 6, fontSize: 12 }}>Email Address</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6eb', borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 10 }}>
						<Text style={{ marginRight: 8 }}>✉️</Text>
						<TextInput placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ flex: 1 }} />
					</View>



					{/* Password */}
					<Text style={{ color: '#556', marginBottom: 6, fontSize: 12 }}>Password</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6eb', borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 10 }}>
						<Text style={{ marginRight: 8 }}>🔒</Text>
						<TextInput placeholder="Create a strong password" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} style={{ flex: 1 }} />
						<Pressable onPress={() => setShowPassword(!showPassword)}>
							<Text style={{ marginLeft: 10 }}>{showPassword ? '🙈' : '👁️'}</Text>
						</Pressable>
					</View>

					{/* Confirm Password */}
					<Text style={{ color: '#556', marginBottom: 6, fontSize: 12 }}>Confirm Password</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6eb', borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 12 }}>
						<Text style={{ marginRight: 8 }}>🔒</Text>
						<TextInput placeholder="Repeat your password" secureTextEntry={!showConfirm} value={confirmPassword} onChangeText={setConfirmPassword} style={{ flex: 1 }} />
						<Pressable onPress={() => setShowConfirm(!showConfirm)}>
							<Text style={{ marginLeft: 10 }}>{showConfirm ? '🙈' : '👁️'}</Text>
						</Pressable>
					</View>

					{/* Terms */}
					<View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
						<Pressable onPress={() => setTerms(!terms)} style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: '#9fbfae', backgroundColor: terms ? '#006d37' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
							{terms ? <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text> : null}
						</Pressable>
						<Text style={{ color: '#3d4a3e', flex: 1, fontSize: 13 }}>
							I agree to the Terms and Conditions and Privacy Policy.
						</Text>
					</View>

					{/* Submit */}
					<TouchableOpacity
						onPress={onSubmit}
						disabled={loading}
						style={{ height: 56, borderRadius: 999, backgroundColor: '#006d37', alignItems: 'center', justifyContent: 'center' }}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Create Account</Text>
						)}
					</TouchableOpacity>


				</View>

				<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 40 }}>
					<Text style={{ color: '#3d4a3e' }}>Already have an account? </Text>
					<Pressable
						onPress={() =>
							router.replace({ pathname: '/login', params: { returnTo: params.returnTo ?? '/' } })
						}
					>
						<Text style={{ color: '#006d37', fontWeight: '700' }}>Login</Text>
					</Pressable>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}

