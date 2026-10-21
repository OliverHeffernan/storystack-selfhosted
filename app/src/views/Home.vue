<script setup lang="ts">
import { api, type User } from '../lib/api';
import { ref, onMounted, computed, watch } from 'vue';
import Selector from '../components/Selector.vue';
import BookContainer from '../components/BookContainer.vue';
import type Option from '../interfaces/Option.ts';
import Book from '../classes/Book.ts';
import sortBooksByDate from '../utils/sortBooks.ts';
import { syncMissingBookColours } from '../utils/bookColourSync';

const user = ref<User | null>(null);
const books = ref<Book[]>([]);
const timeframe = ref('month');
const currentDate = ref(new Date());
const viewMode = ref('card');

// View mode options
const viewOptions: Option[] = [
	{ label: '<i class="fas fa-th-large"></i>', value: 'card' },
	{ label: '<i class="fas fa-list"></i>', value: 'list' },
	{ label: '<i class="fas fa-layer-group"></i> stack', value: 'stack' },
];

// Timeframe options
const timeframeOptions: Option[] = [
	{ label: 'Month', value: 'month' },
	{ label: 'Year', value: 'year' },
	{ label: 'All Time', value: 'all' }
];

onMounted(async () => {
	const { data: currentUser } = await api.me();
	user.value = currentUser;

	// Fetch all books
	const { data, error } = await api.listBooks();
	if (error) {
		console.error('Error fetching books:', error);
	} else {
		books.value = data.map(item => {
			item.start_date = item.start_date ? new Date(item.start_date) : null;
			item.end_date = item.end_date ? new Date(item.end_date) : null;
			return new Book(item) as Book;
		});
		syncMissingBookColours(books.value);
	}
});

// Date range calculation
const dateRange = computed(() => {
	const now = currentDate.value;
	let start: Date, end: Date;

	if (timeframe.value === 'month') {
		start = new Date(now.getFullYear(), now.getMonth(), 1);
		end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	} else if (timeframe.value === 'year') {
		start = new Date(now.getFullYear(), 0, 1);
		end = new Date(now.getFullYear(), 11, 31);
	} else {
		start = new Date(0);
		end = new Date();
	}

	return { start, end };
});

// Filtered books based on timeframe
const filteredBooks = computed(() => {
	if (timeframe.value === 'all') {
		return books.value.filter(book => book.getStatus() === 'read');
	}

	const { start, end } = dateRange.value;
	return books.value.filter(book => {
		// Only include completed books
		if (book.getStatus() !== 'read') return false;

		// For monthly/yearly filtering, use end_date to determine when book was completed
		const completedDate = book.getEndDate();
		if (!completedDate) return false;

		return completedDate >= start && completedDate <= end;
	});
});

// Stats calculations
const stats = computed(() => {
	const booksInPeriod = filteredBooks.value; // Already filtered for completed books

	const totalPages = booksInPeriod.reduce((sum, book) => sum + book.getPages(), 0);
	const avgPagesPerBook = booksInPeriod.length > 0 ? Math.round(totalPages / booksInPeriod.length) : 0;

	// Calculate favorite author (author with most completed books)
	const authorCounts = new Map<string, number>();
	booksInPeriod.forEach(book => {
		const author = book.getAuthor();
		authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
	});

	let favoriteAuthor = 'N/A';
	let maxCount = 0;
	authorCounts.forEach((count, author) => {
		if (count > maxCount) {
			maxCount = count;
			favoriteAuthor = author;
		}
	});

	// Calculate longest book from completed books
	let longestBook = { title: 'N/A', pages: 0 };
	booksInPeriod.forEach(book => {
		if (book.getPages() > longestBook.pages) {
			longestBook = {
				title: book.getTitle(),
				pages: book.getPages()
			};
		}
	});

	return {
		totalBooks: booksInPeriod.length,
		completedBooks: booksInPeriod.length, // Same as totalBooks since we're only showing completed books
		totalPages,
		avgPagesPerBook,
		favoriteAuthor: booksInPeriod.length > 0 ? favoriteAuthor : 'N/A',
		longestBook
	};
});

// Sorted books for display (ordered by completion date, newest first)
const sortedBooks = computed(() => {
	return [...filteredBooks.value].sort(sortBooksByDate);
});

// Period display
const periodDisplay = computed(() => {
	const date = currentDate.value;
	if (timeframe.value === 'month') {
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	} else if (timeframe.value === 'year') {
		return date.getFullYear().toString();
	} else {
		return 'All Time';
	}
});

// Navigation functions
const navigatePrevious = () => {
	const newDate = new Date(currentDate.value);
	if (timeframe.value === 'month') {
		newDate.setMonth(newDate.getMonth() - 1);
	} else if (timeframe.value === 'year') {
		newDate.setFullYear(newDate.getFullYear() - 1);
	}
	currentDate.value = newDate;
};

const navigateNext = () => {
	const newDate = new Date(currentDate.value);
	const now = new Date();

	if (timeframe.value === 'month') {
		newDate.setMonth(newDate.getMonth() + 1);
		if (newDate <= now) {
			currentDate.value = newDate;
		}
	} else if (timeframe.value === 'year') {
		newDate.setFullYear(newDate.getFullYear() + 1);
		if (newDate.getFullYear() <= now.getFullYear()) {
			currentDate.value = newDate;
		}
	}
};

const canNavigateNext = computed(() => {
	const newDate = new Date(currentDate.value);
	const now = new Date();

	if (timeframe.value === 'month') {
		newDate.setMonth(newDate.getMonth() + 1);
		return newDate <= now;
	} else if (timeframe.value === 'year') {
		return newDate.getFullYear() < now.getFullYear();
	}
	return false;
});

// Reset to current period when timeframe changes
watch(timeframe, () => {
	currentDate.value = new Date();
});
</script>
<template>
	<div class="margins">
		<div class="page-header">
			<h1>Dashboard</h1>
		</div>

		<div class="controls">
			<Selector
				:options="timeframeOptions"
				@select="(value: string) => { timeframe = value }"
			/>

			<div v-if="timeframe !== 'all'" class="period-navigation">
				<button @click="navigatePrevious" class="nav-button">‹</button>
				<span class="period-display">{{ periodDisplay }}</span>
				<button @click="navigateNext" class="nav-button" :disabled="!canNavigateNext">›</button>
			</div>
			<div v-else class="period-display-all">
				{{ periodDisplay }}
			</div>
		</div>

		<div class="stats-grid">
			<div class="stat-card primary">
				<h3>{{ stats.completedBooks }}</h3>
				<p>Books Completed</p>
			</div>

			<div class="stat-card">
				<h3>{{ stats.totalPages.toLocaleString() }}</h3>
				<p>Pages Read</p>
			</div>

			<div class="stat-card">
				<h3>{{ stats.avgPagesPerBook }}</h3>
				<p>Avg Pages/Book</p>
			</div>

			<div v-if="stats.completedBooks > 0" class="stat-card">
				<h3>{{ stats.favoriteAuthor }}</h3>
				<p>Favorite Author</p>
			</div>

			<div v-if="stats.completedBooks > 0" class="stat-card longest-book">
				<span class="book-title">{{ stats.longestBook.title }}</span>
				<h3>{{ stats.longestBook.pages.toLocaleString() }}</h3>
				<p>Longest Book (pages)</p>
			</div>
		</div>

		<div class="summary-section">
			<h2>Reading Summary</h2>
			<div class="summary-content">
				<div v-if="stats.completedBooks > 0" class="summary-text">
					<p>
						📚 Great job! You've completed <strong>{{ stats.completedBooks }}</strong>
						{{ stats.completedBooks === 1 ? 'book' : 'books' }}
						{{ timeframe === 'all' ? 'so far' : `this ${timeframe}` }}.
					</p>
					<p v-if="stats.totalPages > 0">
						📖 That's <strong>{{ stats.totalPages.toLocaleString() }}</strong> pages of reading!
					</p>
				</div>
				<div v-else class="summary-text">
					<p>
						📖 No books completed {{ timeframe === 'all' ? 'yet' : `this ${timeframe}` }}.
						Time to dive into your reading list!
					</p>
				</div>
			</div>
		</div>

		<div v-if="stats.completedBooks > 0" class="books-section">
			<div class="books-section-header">
				<h2>Books Completed {{ timeframe === 'all' ? 'So Far' : `This ${timeframe === 'month' ? 'Month' : 'Year'}` }}</h2>
				<Selector
					:options="viewOptions"
					:use-html="true"
					@select="(value: string) => { viewMode = value }"
				/>
			</div>

			<div v-if="viewMode === 'card'" class="books-grid">
				<BookContainer
					v-for="book in sortedBooks"
					:key="book.getUid() || ''"
					:book="book"
					view-mode="card"
				/>
			</div>

			<div v-else-if="viewMode === 'stack'" class="books-stack">
				<BookContainer
					v-for="book in sortedBooks"
					:key="book.getUid() || ''"
					:book="book"
					view-mode="stack"
				/>
			</div>

			<div v-else class="books-list">
				<BookContainer
					v-for="book in sortedBooks"
					:key="book.getUid() || ''"
					:book="book"
					view-mode="list"
				/>
			</div>
		</div>
	</div>
</template>

<style scoped>
.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
}

.page-header h1 {
	margin: 0;
	color: var(--text);
}

.controls {
	display: flex;
	flex-direction: column;
	gap: 16px;
	margin-bottom: 32px;
}

.period-navigation {
	display: flex;
	align-items: center;
	gap: 16px;
	justify-content: center;
}

.period-display, .period-display-all {
	font-size: 1.2rem;
	font-weight: 600;
	color: var(--text);
	min-width: 200px;
	text-align: center;
}

.nav-button {
	background: var(--sec);
	border: none;
	border-radius: 50%;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	font-size: 1.2rem;
	color: var(--text);
	transition: all 0.2s ease;
}

.nav-button:hover:not(:disabled) {
	background: var(--accent);
	color: white;
}

.nav-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 16px;
	margin-bottom: 32px;
}

.stat-card {
	background: var(--prim);
	border: 1px solid var(--sec);
	border-radius: 12px;
	padding: 20px;
	text-align: center;
	transition: all 0.2s ease;
}

.stat-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.primary {
	background: linear-gradient(135deg, var(--accent), #e85a5a);
	color: white;
	border: none;
}

.stat-card.primary h3,
.stat-card.primary p {
	color: white;
}

.stat-card h3 {
	font-size: 2rem;
	font-weight: 700;
	margin: 0 0 8px 0;
	color: var(--accent);
	word-break: break-word;
	line-height: 1.2;
}

/* Special styling for text-based stats like favorite author */
.stat-card h3:not(:empty) {
	font-size: 1.5rem;
}

.stat-card h3:empty::before {
	content: "N/A";
	font-size: 1.5rem;
}

.stat-card p {
	margin: 0;
	color: var(--secondary-text);
	font-size: 0.9rem;
	font-weight: 500;
}

.longest-book .book-title {
	display: block;
	font-size: 0.75rem;
	color: var(--secondary-text);
	margin-bottom: 4px;
	line-height: 1.2;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 600;
}

.summary-section {
	background: var(--prim);
	border: 1px solid var(--sec);
	border-radius: 12px;
	padding: 24px;
	margin-bottom: 32px;
}

.summary-section h2 {
	margin: 0 0 16px 0;
	color: var(--text);
	font-size: 1.5rem;
}

.summary-content {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.summary-text p {
	margin: 0 0 8px 0;
	line-height: 1.5;
	color: var(--secondary-text);
}

.current-reading p {
	margin: 0;
	padding: 12px 16px;
	background: rgba(205, 92, 92, 0.1);
	border-left: 4px solid var(--accent);
	border-radius: 4px;
	color: var(--text);
}

.books-section {
	background: var(--prim);
	border: 1px solid var(--sec);
	border-radius: 12px;
	padding: 24px;
	margin-bottom: 32px;
}

.books-section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	flex-wrap: wrap;
	gap: 16px;
}

.books-section-header h2 {
	margin: 0;
	color: var(--text);
	font-size: 1.5rem;
}

.books-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	gap: 16px;
	justify-items: center;
}

.books-list {
	display: flex;
	flex-direction: column;
}

.books-stack {
	display: flex;
	flex-direction: column;
	gap: 0;
	padding: 10px 0;
}

@media (max-width: 768px) {
	.stats-grid {
		grid-template-columns: repeat(2, 1fr);
	}

	.controls {
		align-items: center;
	}

	.period-display, .period-display-all {
		font-size: 1.1rem;
		min-width: 160px;
	}

	.books-section-header {
		flex-direction: column;
		align-items: stretch;
	}

	.books-grid {
		justify-content: center;
	}
}
</style>
