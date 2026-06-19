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

export default function ResetPwd() {
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [loading, setLoading] = useState(false)

	const router = useRouter()
	const params = useLocalSearchParams<{ email?: string; otp?: string }>()
	const { resetPassword } = useAuth()

	const onUpdate = async () => {
		if (!newPassword.trim() || !confirmPassword.trim()) {
			Alert.alert('Please fill in both password fields.')
			return
		}

		if (newPassword !== confirmPassword) {
			Alert.alert('Passwords do not match.')
			return
		}

		if (newPassword.length < 6) {
			Alert.alert('Password must be at least 6 characters long.')
			return
		}

		setLoading(true)
		try {
			await resetPassword(params.email || '', params.otp || '', newPassword.trim())
			Alert.alert('Password Updated', 'Your password has been successfully updated.', [
				{
					text: 'OK',
					onPress: () => {
						router.replace('/login')
					}
				}
			])
		} catch (error) {
			Alert.alert('Reset failed', error instanceof Error ? error.message : 'Something went wrong. Please try again.')
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
					<Text style={{ fontSize: 24, fontWeight: '700', color: '#161d17' }}>Reset Password</Text>
					<Text style={{ color: '#3d4a3e', marginTop: 10, textAlign: 'center', maxWidth: 320, lineHeight: 20 }}>
						Please choose a new strong password for your account.
					</Text>
				</View>

				<View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
					{/* New Password */}
					<Text style={{ color: '#556', marginBottom: 10, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
						New Password
					</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6eb', borderRadius: 12, paddingHorizontal: 16, height: 54, marginBottom: 16 }}>
						<Text style={{ marginRight: 10, fontSize: 20 }}>🔒</Text>
						<TextInput
							placeholder="Enter new password"
							secureTextEntry={!showNewPassword}
							value={newPassword}
							onChangeText={setNewPassword}
							style={{ flex: 1, fontSize: 16, color: '#161d17' }}
						/>
						<Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
							<Text style={{ fontSize: 18 }}>{showNewPassword ? '🙈' : '👁️'}</Text>
						</Pressable>
					</View>

					{/* Confirm Password */}
					<Text style={{ color: '#556', marginBottom: 10, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
						Confirm New Password
					</Text>
					<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6eb', borderRadius: 12, paddingHorizontal: 16, height: 54, marginBottom: 24 }}>
						<Text style={{ marginRight: 10, fontSize: 20 }}>🔒</Text>
						<TextInput
							placeholder="Confirm new password"
							secureTextEntry={!showConfirmPassword}
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							style={{ flex: 1, fontSize: 16, color: '#161d17' }}
						/>
						<Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
							<Text style={{ fontSize: 18 }}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
						</Pressable>
					</View>

					{/* Update Button */}
					<TouchableOpacity
						onPress={onUpdate}
						disabled={loading}
						style={{ height: 56, borderRadius: 999, backgroundColor: '#006d37', alignItems: 'center', justifyContent: 'center', shadowColor: '#006d37', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Update Password</Text>
						)}
					</TouchableOpacity>
				</View>

				<View style={{ alignItems: 'center', marginTop: 30 }}>
					<Pressable onPress={() => router.replace('/login')}>
						<Text style={{ color: '#65735e', fontWeight: '600', textDecorationLine: 'underline' }}>
							Cancel & Back to Login
						</Text>
					</Pressable>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}
