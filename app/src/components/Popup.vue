<template>
	<div class="popup-overlay" @click.self="$emit('close')">
		<div class="popup-content">
			<div class="popup-inner margins">
				<slot></slot>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

// Emit close event for clicking outside
defineEmits<{
	(e: 'close'): void;
}>();

// Prevent body scroll when popup is open
onMounted(() => {
	document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
	document.body.style.overflow = '';
});
</script>
<style scoped>
.popup-content {
	background: white;
	padding: 20px;
	border-radius: 8px;
	max-width: 100vw;
	max-height: 90vh;
	overflow-y: auto;
	overscroll-behavior: contain;
	-webkit-overflow-scrolling: touch;
}

.popup-inner {
	/* This will contain the margins class styling */
}

.popup-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1001;
	overflow-y: auto;
	-webkit-overflow-scrolling: touch;
	padding: 20px;
	box-sizing: border-box;
}

@media (max-width: 768px) {
	.popup-overlay {
		align-items: flex-start;
		padding: 0;
		background: rgba(0, 0, 0, 0.5);
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.popup-content {
		z-index: 1005;
		width: 100vw;
		max-width: 100vw;
		max-height: none;
		height: 100vh;
		margin: 0;
		border-radius: 0;
		padding: 0;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.popup-inner {
		padding: 20px;
	}
}
</style>
