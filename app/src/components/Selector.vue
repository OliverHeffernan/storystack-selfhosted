<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import type Option from '../interfaces/Option.ts';
const props = defineProps<{
	options: Array<Option>;
	colorSwap?: boolean;
	useHtml?: boolean;
}>();

//const emit = defineEmits(props.options.map(option => option.value));
const emit = defineEmits<{
	(e: 'select', value: string): void;
}>();

const value = ref<string>('');

onMounted(() => {
	if (props.options && props.options.length > 0 && props.options[0]) {
		value.value = props.options[0].value;
		//emit('select', value.value);
	}
});
</script>
<template>
	<div class="container">
		<div
			class="selector"
			:class="{ 'colorSwap': colorSwap }"
		>
			<button
				v-for="option in options"
				:key="option.value"
				:class="{
					selectorOption: true,
					clickable: true,
					selected: option.value === value,
					colorSwap: colorSwap
				}"
				@click="value = option.value; $emit('select', option.value)"
			>
				<span v-if="useHtml" v-html="option.label"></span>
				<span v-else>{{ option.label }}</span>
			</button>
		</div>
	</div>
</template>

<style scoped>
.container {
	width: 100%;
	overflow-x: auto;
}
.selector {
	display: flex;
	width: fit-content;
	max-width: 100%;
	gap: 4px;
	background-color: var(--sec);
	padding: 5px;
	border-radius: 30px;
}

.selector.colorSwap {
	background-color: var(--prim);
}

.selectorOption {
	padding: 8px 12px;
	border-radius: 30px;
	text-wrap: nowrap;
	border: none;
	font-size: 0.8rem;
	flex: 0 0 auto;
	background-color: var(--sec)
}

.selected {
	background-color: var(--prim);
}

.selected.colorSwap {
	background-color: var(--sec);
}
</style>
