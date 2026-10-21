<template>
	<nav class="bottom-nav">
		<div class="margins">
			<RouterLink to="/app/books" class="nav-item" active-class="active">
				<i class="icon">📚</i>
				<span>Books</span>
			</RouterLink>
			<RouterLink to="/app" class="nav-item" active-class="active">
				<i class="icon">🏠</i>
				<span>Home</span>
			</RouterLink>
			<RouterLink to="/app/books/add" class="nav-item" active-class="active">
				<i class="icon">➕</i>
				<span>Add</span>
			</RouterLink>
			<button @click="handleSignOut" class="nav-item sign-out-btn">
				<i class="icon">🚪</i>
				<span>Sign Out</span>
			</button>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { api } from '../lib/api';

const router = useRouter();

const handleSignOut = async () => {
	try {
		const { error } = await api.signOut();
		if (error) throw error;
		router.push({ name: 'Sign In' });
	} catch (error) {
		console.error('Error signing out:', error);
	}
};
</script>

<style scoped>
.bottom-nav {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: var(--prim);
	border-top: 1px solid var(--sec);
	display: flex;
	justify-content: space-around;
	padding: 8px 0 max(8px, env(safe-area-inset-bottom));
	z-index: 1000;
	box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.margins {
	width: 100%;
	max-width: 600px;
	margin: 0 auto;
	display: flex;
	justify-content: space-around;
	padding: 0;
}

.nav-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-decoration: none;
	color: var(--secondary-text);
	padding: 8px 16px;
	border-radius: 12px;
	transition: all 0.2s ease;
	min-width: 60px;
	flex: 1;
	max-width: 80px;
}

.nav-item:hover {
	color: var(--accent);
	background: rgba(205, 92, 92, 0.1);
}

.nav-item.active {
	color: var(--accent);
	background: rgba(205, 92, 92, 0.15);
}

.nav-item .icon {
	font-size: 20px;
	margin-bottom: 4px;
}

.nav-item span {
	font-size: 12px;
	font-weight: 500;
}

.sign-out-btn {
	background: none;
	border: none;
	cursor: pointer;
	font-family: inherit;
}

.sign-out-btn:hover {
	color: #dc2626;
	background: rgba(220, 38, 38, 0.1);
}
</style>
