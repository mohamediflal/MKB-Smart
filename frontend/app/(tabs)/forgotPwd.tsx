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
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'

export default function ForgotPwd() {
	const [email, setEmail] = useState('')
	const [loading, setLoading] = useState(false)
	const router = useRouter()
	const { forgotPassword } = useAuth()

	const onSubmit = async () => {
		if (!email.trim()) {
			Alert.alert('Please enter your email address.')
			return
		}

		setLoading(true)
		try {
			await forgotPassword(email.trim())
			Alert.alert('Verification Sent', 'An OTP code has been sent to your email.', [
				{
					text: 'OK',
					onPress: () => {
						router.push({
							pathname: '/otpPage',
							params: {
								email: email.trim(),
								mode: 'forgot',
							}
						})
					}
				}
			])
		} catch (error) {
			Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong. Please try again.')
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
			<ScrollView contentContainerStyle={{ padding: 20, paddingTop: Platform.OS === 'ios' ? 100 : 70, paddingBottom: 80, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
				<View style={{ alignItems: 'center', marginBottom: 16 }}>
					<Image
						source={{
							uri: 'https://lh3.googleusercontent.com/aida/AP1WRLuFlM0lqeS7jhzlrOAtJ8tT-uRX35DFMAv4BOGDTq7YSMLJ4quBgtCpYBlSWQzmF45L9N6c3k9GVMR-U3mg4noAJ0ep5jTyfqa-nIFMymClq1wQb57ZCOZSQdV0Y4Zh7YIVILRiaEPbHAMNelRs5DcjvWhKgw01E6eXVKc7Svfu7DRvFe1xuoeaO3Tu2I0I2-d4cIpVGE5zUtvoCnqxAuLXXpi8KkQ8IPI8vOFECQ9agFgv2UGUo2ShLA',
						}}
						style={{ width: 160, height: 160, resizeMode: 'contain', borderRadius: 16 }}
					/>
				</View>

				<View style={{ alignItems: 'center', marginBottom: 24 }}>
					<Text style={{ fontSize: 24, fontWeight: '700', color: '#161d17' }}>Forgot Password</Text>
					<Text style={{ color: '#3d4a3e', marginTop: 10, textAlign: 'center', maxWidth: 320, lineHeight: 20 }}>
						Enter your email address below, and we will send you a 6-digit OTP code to verify your identity.
					</Text>
				</View>

				<View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
					{/* Email */}
					<Text style={{ color: '#556', marginBottom: 10, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
						Email Address
					</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6eb', borderRadius: 12, paddingHorizontal: 16, height: 54, marginBottom: 20 }}>
						<Text style={{ marginRight: 10, fontSize: 20 }}>✉️</Text>
						<TextInput
							placeholder="name@example.com"
							keyboardType="email-address"
							autoCapitalize="none"
							autoFocus
							value={email}
							onChangeText={setEmail}
							style={{ flex: 1, fontSize: 16, color: '#161d17' }}
						/>
					</View>

					{/* Confirm Button */}
					<TouchableOpacity
						onPress={onSubmit}
						disabled={loading}
						style={{ height: 56, borderRadius: 999, backgroundColor: '#006d37', alignItems: 'center', justifyContent: 'center', shadowColor: '#006d37', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Confirm</Text>
						)}
					</TouchableOpacity>
				</View>

				<View style={{ alignItems: 'center', marginTop: 30 }}>
					<Pressable onPress={() => router.replace('/login')}>
						<Text style={{ color: '#65735e', fontWeight: '600', textDecorationLine: 'underline' }}>
							Back to Login
						</Text>
					</Pressable>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}
