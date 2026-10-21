<script setup lang="ts">
import BookEdit from "./BookEdit.vue";
import Book from "../classes/Book";
import { computed, ref, type Ref, onBeforeUnmount, onMounted } from "vue";
import { resolveBookDisplayColour } from "../utils/dominantColor";

const deleted: Ref<boolean> = ref<boolean>(false);

const props = defineProps<{
	book: Book;
	viewMode?: 'list' | 'card' | 'stack';
}>();

const _book = ref(props.book);

const imageLoaded: Ref<boolean> = ref<boolean>(false);
const stackItemElement = ref<HTMLElement | null>(null);
const stackItemWidthPx = ref(0);
let stackResizeObserver: ResizeObserver | null = null;

const editing: Ref<boolean> = ref<boolean>(false);

function formatDate(date: Date | null): string {
	if (!date) return '';
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	return `${day}/${month}/${year}`;
}

const img: Ref<HTMLImageElement> = ref<HTMLImageElement>(new Image());

function getContrastingTextColor(color: string): string {
	const normalized = resolveBookDisplayColour(color);
	const hex = normalized.startsWith('#') ? normalized.slice(1) : normalized;
	if (hex.length !== 6) return '#ffffff';

	const red = Number.parseInt(hex.slice(0, 2), 16);
	const green = Number.parseInt(hex.slice(2, 4), 16);
	const blue = Number.parseInt(hex.slice(4, 6), 16);
	const luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue);

	return luminance > 150 ? '#111111' : '#ffffff';
}

const stackBackgroundColor = computed(() => resolveBookDisplayColour(_book.value.getColour()));
const stackTextColor = computed(() => getContrastingTextColor(stackBackgroundColor.value));

const PAGE_THICKNESS_CM = 0.0064102564;
const COVER_HEIGHT_CM = 19.6;
const PAGE_TO_SPINE_RATIO = PAGE_THICKNESS_CM / COVER_HEIGHT_CM;

const stackHeightPx = computed(() => {
	const pages = _book.value.getPages();
	if (!pages || pages <= 0) return 24;

	const widthPx = stackItemWidthPx.value > 0 ? stackItemWidthPx.value : 320;
	const rawHeight = widthPx * pages * PAGE_TO_SPINE_RATIO;
	return Math.max(24, Math.min(140, Math.round(rawHeight)));
});

onMounted(() => {
	const imageUrl = _book.value.getImageUrl() || '';

	img.value.src = imageUrl;
	img.value.onload = () => {
		imageLoaded.value = true;
	};
	img.value.onerror = () => {
		imageLoaded.value = false;
	};

	if (props.viewMode === 'stack' && stackItemElement.value) {
		stackItemWidthPx.value = stackItemElement.value.clientWidth;
		stackResizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			stackItemWidthPx.value = entry.contentRect.width;
		});
		stackResizeObserver.observe(stackItemElement.value);
	}
});

onBeforeUnmount(() => {
	if (stackResizeObserver) {
		stackResizeObserver.disconnect();
		stackResizeObserver = null;
	}
});

function getStatusIcon(status: string): string {
	switch (status) {
		case 'read': return '✅';
		case 'reading': return '📖';
		case 'want-to-read': return '📚';
		default: return '📚';
	}
}

function getStatusColor(status: string): string {
	switch (status) {
		case 'read': return '#22c55e';
		case 'reading': return '#f59e0b';
		case 'want-to-read': return '#3b82f6';
		default: return '#3b82f6';
	}
}

function getStatusText(status: string): string {
	switch (status) {
		case 'read': return 'Completed';
		case 'reading': return 'Reading';
		case 'want-to-read': return 'Want to Read';
		default: return 'Unknown';
	}
}

function getMainSubTitle(title: string): string[] {
	// remove brackets and their content
	title = title.replace(/\s*\(.*?\)\s*/g, ' ').trim();
	if (title.length < 30) {
		return [title, ''];
	}
	if (title.includes(":")) {
		const parts = title.split(":");
		return [parts[0] || '', parts.slice(1).join(":") || ''];
	}
	if (title.includes(" - ")) {
		const parts = title.split(" - ");
		return [parts[0] || '', parts.slice(1).join(" - ") || ''];
	}
	if (title.includes(" and ")) {
		const parts = title.split(" and ");
		return [parts[0] || '', "and " + parts.slice(1).join(" and")];
	}
	return [title.substring(0, 30) + "...", ''];
}
</script>

<template>
	<BookEdit
		v-if="editing && !deleted"
		:book="_book"
		:editing="editing"
		@close="editing = false"
		@update="(updatedBook: Book) => { _book = updatedBook; editing = false; }"
		@delete="(bookId: string) => { deleted = true; editing = false; }"
	/>

	<!-- Card View -->
	<div v-if="!deleted && viewMode === 'card'" class="book-card" @click="editing = true">
		<img v-if="imageLoaded" :src="img.src" alt="Book Cover" class="book-cover-card" />
		<div v-else class="book-cover-placeholder-card">
			<p class="title-card">{{ getMainSubTitle(_book.getTitle())[0] }}</p>
			<p class="subtitle-card">{{ getMainSubTitle(_book.getTitle())[1] }}</p>
			<p class="author-card">{{ _book.getAuthor() }}</p>
		</div>
	</div>
	<!-- Stack View -->
	<div
		v-else-if="!deleted && viewMode === 'stack'"
		ref="stackItemElement"
		class="book-stack-item"
		:style="{
			backgroundColor: stackBackgroundColor,
			color: stackTextColor,
			height: `${stackHeightPx}px`,
			minHeight: `${stackHeightPx}px`
		}"
		@click="editing = true"
	>
		<p class="stack-title">{{ getMainSubTitle(_book.getTitle())[0] }}</p>
		<p class="stack-subtitle">{{ getMainSubTitle(_book.getTitle())[1] }}</p>
		<p class="stack-author">{{ _book.getAuthor() }}</p>
	</div>

	<!-- List View (Default) -->
	<div v-if="!deleted && (!viewMode || viewMode === 'list')" class="book-list-item">
		<div class="book-cover-section">
			<img v-if="imageLoaded" :src="img.src" alt="Book Cover" class="book-cover-list" />
			<div v-else class="book-cover-placeholder-list">
				<p class="title-placeholder">{{ getMainSubTitle(_book.getTitle())[0] }}</p>
				<p class="subtitle-placeholder">{{ getMainSubTitle(_book.getTitle())[1] }}</p>
			</div>
		</div>

		<div class="book-info">
			<div class="book-main-info">
				<h3 class="book-title-list">{{ _book.getTitle() }}</h3>
				<p class="book-author-list">{{ _book.getAuthor() }}</p>
			</div>

			<div class="book-meta">
				<div class="status-badge" :style="{ backgroundColor: getStatusColor(_book.getStatus()) }">
					<span class="status-icon">{{ getStatusIcon(_book.getStatus()) }}</span>
					<span class="status-text">{{ getStatusText(_book.getStatus()) }}</span>
				</div>

				<div v-if="_book.getPages() > 0" class="pages-info">
					<i class="fas fa-book-open"></i>
					<span>{{ _book.getPages() }} pages</span>
				</div>
			</div>

			<div v-if="_book.getStartDate() || _book.getEndDate()" class="book-dates-list">
				<div v-if="_book.getStartDate()" class="date-item">
					<i class="fas fa-play-circle"></i>
					<span>Started: {{ formatDate(_book.getStartDate()) }}</span>
				</div>
				<div v-if="_book.getEndDate()" class="date-item">
					<i class="fas fa-check-circle"></i>
					<span>Finished: {{ formatDate(_book.getEndDate()) }}</span>
				</div>
			</div>
		</div>

		<div class="book-actions">
			<button @click="editing = true" class="edit-button">
				<i class="fas fa-edit"></i>
				<span>Edit</span>
			</button>
		</div>
	</div>
</template>
<style scoped>
/* List View Styles - Improved Design */
.book-list-item {
	display: flex;
	align-items: flex-start;
	gap: 20px;
	padding: 20px;
	margin-bottom: 16px;
	background: var(--prim);
	border: 1px solid var(--sec);
	border-radius: 12px;
	transition: all 0.2s ease;
	position: relative;
}

.book-list-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	border-color: var(--accent);
}

.book-cover-section {
	flex-shrink: 0;
}

.book-cover-list {
	width: 80px;
	height: auto;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	transition: transform 0.2s ease;
}

.book-list-item:hover .book-cover-list {
	transform: scale(1.05);
}

.book-cover-placeholder-list {
	width: 80px;
	height: 120px;
	background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	padding: 8px;
	box-sizing: border-box;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.title-placeholder {
	font-size: 11px;
	font-weight: 600;
	margin: 0 0 4px 0;
	line-height: 1.2;
	color: #374151;
}

.subtitle-placeholder {
	font-size: 9px;
	margin: 0;
	line-height: 1.1;
	color: #6b7280;
}

.book-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12px;
	min-width: 0;
}

.book-main-info h3 {
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--text);
	line-height: 1.3;
	word-wrap: break-word;
}

.book-author-list {
	margin: 4px 0 0 0;
	font-size: 1rem;
	color: var(--secondary-text);
	font-style: italic;
}

.book-meta {
	display: flex;
	align-items: center;
	gap: 16px;
	flex-wrap: wrap;
}

.status-badge {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 20px;
	font-size: 0.875rem;
	font-weight: 500;
	color: white;
	white-space: nowrap;
}

.status-icon {
	font-size: 0.875rem;
}

.pages-info {
	display: flex;
	align-items: center;
	gap: 6px;
	color: var(--secondary-text);
	font-size: 0.875rem;
}

.pages-info i {
	color: var(--accent);
}

.book-dates-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.date-item {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.875rem;
	color: var(--secondary-text);
}

.date-item i {
	color: var(--accent);
	width: 14px;
}

.book-actions {
	flex-shrink: 0;
	display: flex;
	align-items: flex-start;
}

.edit-button {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: var(--sec);
	color: var(--text);
	border: none;
	border-radius: 8px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
}

.edit-button:hover {
	background: var(--accent);
	color: white;
	transform: translateY(-1px);
}

.edit-button i {
	font-size: 0.875rem;
}

/* Legacy styles for old list view (keeping for compatibility) */
h2 {
	width: fit-content;
	border-bottom: 2px solid var(--accent);
}

.book-cover-placeholder {
	background-color: #eee;
	margin: 0;
	padding: 0;
	font-size: 14px;
	color: #555;
	text-align: center;
	padding: 10px;
	width: 130px;
	min-width: 130px;
	max-width: 130px;
	height: 201px;
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: center;
	box-sizing: border-box;
}

.book-cover-placeholder .title {
	width: 100%;
	margin: 0 auto;
	font-size: 19px;
}

.book-cover-placeholder .subtitle {
	width: 90%;
	margin: 0 auto;
	font-size: 16px;
	margin-top: 10px;
	color: #777;
}

.book-container {
	display: flex;
	position: relative;
	gap: 20px;
	margin: 20px 0;
	padding: 10px;
	border-bottom: 1px var(--accent) solid;
}

.bottom-right {
	position: absolute;
	bottom: 10px;
	right: 10px;
}

/* Card View Styles */
.book-card {
	cursor: pointer;
	transition: transform 0.2s ease;
	width: 100%;
	max-width: 120px;
	margin: 0 auto;
}

.book-card:hover {
	transform: translateY(-4px);
}

.book-cover-card {
	width: 100%;
	height: auto;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	transition: box-shadow 0.2s ease;
}

.book-card:hover .book-cover-card {
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.book-cover-placeholder-card {
	background-color: #eee;
	width: 100%;
	height: 180px;
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	padding: 10px;
	box-sizing: border-box;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	transition: box-shadow 0.2s ease;
}

.book-card:hover .book-cover-placeholder-card {
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

/* Stack View Styles */
.book-stack-item {
	position: relative;
	display: flex;
	align-items: center;
	gap: 16px;
	min-height: 52px;
	padding: 8px 16px;
	margin-top: -6px;
	border-radius: 8px;
	border-left: 8px solid rgba(255, 255, 255, 0.35);
	box-shadow: 0 3px 10px rgba(0, 0, 0, 0.22);
	cursor: pointer;
	transition: transform 0.18s ease, box-shadow 0.18s ease;
	overflow: hidden;
}

.book-stack-item:first-of-type {
	margin-top: 0;
}

.book-stack-item:hover {
	transform: translateX(4px);
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
	z-index: 2;
}

.book-stack-item p {
	color: inherit;
}

.stack-title {
	margin: 0;
	font-size: 0.95rem;
	font-weight: 700;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 44%;
	letter-spacing: 0.01em;
}

.stack-subtitle {
	margin: 0;
	font-size: 0.78rem;
	opacity: 0.9;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 33%;
}

.stack-author {
	margin: 0 0 0 auto;
	font-size: 0.74rem;
	font-style: italic;
	opacity: 0.95;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 22%;
}

.title-card {
	font-size: 14px;
	font-weight: bold;
	margin: 0 0 8px 0;
	line-height: 1.2;
	color: #333;
}

.subtitle-card {
	font-size: 12px;
	margin: 0 0 8px 0;
	line-height: 1.1;
	color: #666;
}

.author-card {
	font-size: 11px;
	margin: 0;
	color: #888;
	font-style: italic;
}

/* Responsive Design */
@media (max-width: 768px) {
	.book-list-item {
		gap: 12px;
		padding: 16px;
	}

	.book-cover-list {
		width: 60px;
	}

	.book-cover-placeholder-list {
		width: 60px;
		height: 90px;
	}

	.book-main-info h3 {
		font-size: 1.1rem;
	}

	.book-author-list {
		font-size: 0.9rem;
	}

	.status-badge {
		padding: 4px 8px;
		font-size: 0.8rem;
	}

	.pages-info {
		font-size: 0.8rem;
	}

	.date-item {
		font-size: 0.8rem;
	}

	.edit-button {
		padding: 6px 12px;
		font-size: 0.8rem;
	}
}

@media (max-width: 480px) {
	.book-list-item {
		gap: 8px;
		padding: 12px;
	}

	.book-cover-list {
		width: 50px;
	}

	.book-cover-placeholder-list {
		width: 50px;
		height: 75px;
	}

	.book-main-info h3 {
		font-size: 1rem;
	}

	.book-author-list {
		font-size: 0.85rem;
	}

	.book-meta {
		flex-wrap: wrap;
		gap: 8px;
	}

	.status-badge {
		padding: 3px 6px;
		font-size: 0.75rem;
	}

	.pages-info {
		font-size: 0.75rem;
	}

	.date-item {
		font-size: 0.75rem;
	}

	.edit-button {
		padding: 4px 8px;
		font-size: 0.75rem;
	}
}
</style>
