import React, { useState } from 'react'
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Image,
	Pressable,
	Alert,
	KeyboardAvoidingView,
	Platform,
	Switch,
	ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [remember, setRemember] = useState(false)
	const [loading, setLoading] = useState(false)
	const router = useRouter()
	const params = useLocalSearchParams<{ returnTo?: string }>()
	const { login } = useAuth()

	const onLogin = async () => {
		if (!email.trim() || !password.trim()) {
			Alert.alert('Please enter both email and password.')
			return
		}

		setLoading(true)
		try {
			await login(email.trim(), password.trim())
			const destination = params.returnTo ?? '/'
			router.replace(destination)
		} catch (error) {
			Alert.alert('Login failed', error instanceof Error ? error.message : 'Please try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={{ flex: 1, backgroundColor: '#f9f9ff' }}
		>
			<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
				<View style={{ height: 260, backgroundColor: '#ddd' }}>
					<Image
						source={{ uri: 'https://lh3.googleusercontent.com/aida/AP1WRLuZHDTzu9orrmYk32TZWeCAOwfRFgx99Dc1ghFS7EsLqjbO2X1TZu3mpTLySiDRPIC8ydoJ7FW2xhw1-6QKd_NwJRkvnlB9dAJOQm2yb0bGA-UfIAiaAodHYBYUyjqrdV_ThkdiDU53wj_4Gq68dkz3PNsmKwPh8FnkurARwxpIG3gkAuU8WWqfBfe-5N2adZSl7RUstt0T5PjB-RVfPxIHQOJeqmtBcPYxGcwPdwxg6txiREruiiiVOA' }}
						style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
					/>
				</View>

				<View style={{ maxWidth: 420, width: '100%', alignSelf: 'center', marginTop: -64, paddingHorizontal: 20 }}>
					<View style={{ alignItems: 'center', marginBottom: 12 }}>
						<Image
							source={{ uri: 'https://lh3.googleusercontent.com/aida/AP1WRLt9p0ZKtr_EQNyufYmyYtkabFBlXdLGJDMMMiP6qYugDTRn3P7iHOF0ZQAD_yZRZoPZxEHDl7dZ4tlSapUw5jUQN_47YuJwZBv7xSc9E0OvRnIFRm6C70YdfA_yNYVBUEU93JaznDaKhzmrdhfrbVJy-ZQ0ejsyiuRlKq07oAFxHYnjqwhfZ5Measf8BnWZO8j_Kdqv5YMwYpHpRtvAf5t9yzrll6AvmKmPjXckyyQ4K64GvKtXbj__q3o' }}
							style={{ width: 96, height: 96, borderRadius: 999 }}
						/>
					</View>

					<View style={{ marginBottom: 12, alignItems: 'center' }}>
						<Text style={{ fontSize: 20, fontWeight: '700', color: '#151c27' }}>Welcome Back</Text>
						<Text style={{ color: '#6b7280', marginTop: 6 }}>Login to continue shopping fresh groceries</Text>
					</View>

					<View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
						{/* Email */}
						<Text style={{ color: '#556', marginBottom: 6, fontSize: 12 }}>Email Address</Text>
						<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f3ff', borderRadius: 12, paddingHorizontal: 12, height: 52, marginBottom: 12, borderWidth: 1, borderColor: '#dcdfe8' }}>
							<Text style={{ marginRight: 10 }}>✉️</Text>
							<TextInput placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ flex: 1 }} />
						</View>

						{/* Password */}
						<Text style={{ color: '#556', marginBottom: 6, fontSize: 12 }}>Password</Text>
						<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f3ff', borderRadius: 12, paddingHorizontal: 12, height: 52, marginBottom: 8, borderWidth: 1, borderColor: '#dcdfe8' }}>
							<Text style={{ marginRight: 10 }}>🔒</Text>
							<TextInput secureTextEntry={!showPassword} placeholder="••••••••" value={password} onChangeText={setPassword} style={{ flex: 1 }} />
							<Pressable onPress={() => setShowPassword(!showPassword)}>
								<Text style={{ marginLeft: 8 }}>{showPassword ? '🙈' : '👁️'}</Text>
							</Pressable>
						</View>

						{/* Remember / Forgot */}
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 }}>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<Switch value={remember} onValueChange={setRemember} thumbColor={remember ? '#006c49' : undefined} />
								<Text style={{ marginLeft: 8, color: '#6b7280' }}>Remember Me</Text>
							</View>
							<TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Forgot password flow coming soon')}>
								<Text style={{ color: '#006c49', fontWeight: '700' }}>Forgot Password?</Text>
							</TouchableOpacity>
						</View>

						{/* Login Button */}
						<TouchableOpacity onPress={onLogin} disabled={loading} style={{ height: 52, borderRadius: 12, backgroundColor: '#006c49', alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 12 }}>
							{loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Login</Text>}
						</TouchableOpacity>

						
					</View>

					<View style={{ alignItems: 'center', marginTop: 14 }}>
						<Text style={{ color: '#6b7280' }}>
							Don't have an account?{' '}
							<Pressable onPress={() => router.push('/register')}><Text style={{ color: '#006c49', fontWeight: '700' }}>Create Account</Text></Pressable>
						</Text>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}

