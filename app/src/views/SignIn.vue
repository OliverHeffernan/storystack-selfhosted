<template>
	<div class="auth-container">
		<div class="auth-card">
			<div class="auth-header">
				<h1>Welcome Back</h1>
				<p>Sign in to continue to StoryStack</p>
			</div>

			<form @submit.prevent="handleSignIn" class="auth-form">
				<div class="form-group">
					<label for="email">Email Address</label>
					<input 
						type="email" 
						v-model="emailRef" 
						id="email" 
						placeholder="Enter your email"
						required 
						:disabled="loading"
					/>
				</div>
				
				<div class="form-group">
					<label for="password">Password</label>
					<input 
						type="password" 
						v-model="passwordRef" 
						id="password" 
						placeholder="Enter your password"
						required 
						:disabled="loading"
					/>
				</div>

				<div v-if="errorMsg" class="error-message">
					<i class="fas fa-exclamation-circle"></i>
					{{ errorMsg }}
				</div>

				<button type="submit" class="auth-button" :disabled="loading">
					<span v-if="loading" class="loading-spinner"></span>
					<span v-else>Sign In</span>
				</button>
			</form>

			<div class="auth-footer">
				<p>Don't have an account? 
					<RouterLink :to="{ name: 'Sign Up' }" class="auth-link">Sign up here</RouterLink>
				</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { api } from '../lib/api';

const router = useRouter();

const emailRef = ref('');
const passwordRef = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function handleSignIn() {
	if (loading.value) return;
	
	loading.value = true;
	errorMsg.value = '';
	
	try {
		const { error } = await api.signIn(emailRef.value, passwordRef.value);
		
		if (error) throw error;
		router.push({ name: 'Home' });
	} catch (error: any) {
		errorMsg.value = error.message || 'An error occurred during sign in';
	} finally {
		loading.value = false;
	}
}
</script>

<style scoped>
.auth-container {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	padding: 20px;
}

.auth-card {
	background: var(--prim);
	border-radius: 16px;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	padding: 40px;
	width: 100%;
	max-width: 400px;
	border: 1px solid var(--sec);
}

.auth-header {
	text-align: center;
	margin-bottom: 32px;
}

.auth-header h1 {
	font-size: 2rem;
	font-weight: 700;
	color: var(--text);
	margin: 0 0 8px 0;
}

.auth-header p {
	color: var(--secondary-text);
	font-size: 1rem;
	margin: 0;
}

.auth-form {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.form-group label {
	font-weight: 600;
	color: var(--text);
	font-size: 0.9rem;
}

.form-group input {
	padding: 12px 16px;
	border: 2px solid var(--sec);
	border-radius: 8px;
	font-size: 1rem;
	transition: all 0.2s ease;
	background: var(--prim);
	color: var(--text);
}

.form-group input:focus {
	outline: none;
	border-color: var(--accent);
	box-shadow: 0 0 0 3px rgba(205, 92, 92, 0.1);
}

.form-group input:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.form-group input::placeholder {
	color: var(--secondary-text);
}

.error-message {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	background: #fee2e2;
	border: 1px solid #fecaca;
	border-radius: 8px;
	color: #dc2626;
	font-size: 0.875rem;
}

.error-message i {
	flex-shrink: 0;
}

.auth-button {
	padding: 14px 20px;
	background: var(--accent);
	color: white;
	border: none;
	border-radius: 8px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 48px;
}

.auth-button:hover:not(:disabled) {
	background: #b91c1c;
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(205, 92, 92, 0.3);
}

.auth-button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

.loading-spinner {
	width: 20px;
	height: 20px;
	border: 2px solid transparent;
	border-top: 2px solid white;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.auth-footer {
	text-align: center;
	margin-top: 24px;
	padding-top: 24px;
	border-top: 1px solid var(--sec);
}

.auth-footer p {
	color: var(--secondary-text);
	font-size: 0.9rem;
	margin: 0;
}

.auth-link {
	color: var(--accent);
	text-decoration: none;
	font-weight: 600;
	transition: color 0.2s ease;
}

.auth-link:hover {
	color: #b91c1c;
	text-decoration: underline;
}

@media (max-width: 480px) {
	.auth-container {
		padding: 16px;
	}
	
	.auth-card {
		padding: 24px;
	}
	
	.auth-header h1 {
		font-size: 1.75rem;
	}
}
</style>
