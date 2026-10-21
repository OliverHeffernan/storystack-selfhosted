<script setup lang="ts">
const emit = defineEmits<{
	(e: 'click'): void;
}>();
</script>
<template>
	<button @click="$emit('click')">
		<slot></slot>
	</button>
</template>
<style scoped>
button {
	background: var(--secondary-text);
	border: none;
	color: white;
	padding: 10px 20px;
	border-radius: 5px;
	cursor: pointer;
	font-size: 1rem;
	transition: background 0.3s;
}
</style>
