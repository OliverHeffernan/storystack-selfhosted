<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import BottomNavigation from './components/BottomNavigation.vue';
import { computed } from 'vue';

const route = useRoute();

// Show bottom navigation only on app pages (not on auth pages)
const showBottomNav = computed(() => {
	return route.path.startsWith('/app');
});
</script>

<template>
	<div class="app-container">
		<main class="main-content" :class="{ 'with-bottom-nav': showBottomNav }">
			<RouterView />
		</main>
		<BottomNavigation v-if="showBottomNav" />
	</div>
</template>

<style>
* {
	padding: 0;
	margin: 0;
	color: var(--text);
	font-family: "Roboto", sans-serif;
	box-sizing: border-box;
}

html, body {
	overflow-x: hidden;
	width: 100%;
	position: relative;
}

body {
	touch-action: manipulation;
}

/* Prevent horizontal scroll on all elements */
* {
	max-width: 100%;
}

/* Ensure form inputs don't cause horizontal scroll */
input, textarea, select {
	max-width: 100%;
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
}

p {
	color: var(--secondary-text);
}

:root {
	--accent: #CD5C5C;
	--text: #222222;
	--secondary-text: #777777;
	--prim: #FFFFFF;
	--sec: #dddddd;
}

.app-container {
	min-height: 100vh;
	overflow-x: hidden;
	position: relative;
}

.main-content {
	padding-bottom: 0;
	min-height: 100vh;
	overflow-x: hidden;
}

.main-content.with-bottom-nav {
	padding-bottom: 80px;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.margins {
	width: min(90%, 600px);
	margin: auto;
	padding: 20px 0;
}

.marginsLanding {
	width: min(95%, 800px);
	margin: auto;
	padding: 20px 0;
}

.icon-button {
	background: none;
	border: none;
	cursor: pointer;
	font-size: 1.2rem;
	color: var(--secondary-text);
}

i {
	color: inherit;
}

/* Improved RouterLink styling */
a {
	color: var(--accent);
	text-decoration: none;
	transition: all 0.2s ease;
}

a:hover {
	color: var(--text);
	text-decoration: underline;
}

.router-link {
	display: inline-block;
	padding: 8px 16px;
	background: var(--accent);
	color: white;
	border-radius: 6px;
	text-decoration: none;
	font-weight: 500;
	transition: all 0.2s ease;
	margin: 4px 8px 4px 0;
}

.router-link:hover {
	background: var(--text);
	color: white;
	text-decoration: none;
	transform: translateY(-1px);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.router-link.secondary {
	background: var(--sec);
	color: var(--text);
}

.router-link.secondary:hover {
	background: var(--secondary-text);
	color: white;
}

</style>
