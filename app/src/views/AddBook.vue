<template>
	<div class="margins">
		<div class="page-header">
			<h1>Add a Book</h1>
			<RouterLink :to="{ name: 'Import Books' }" class="import-button">
				<i class="fas fa-upload"></i>
				Import from Goodreads
			</RouterLink>
		</div>

		<div class="book-form-container">
			<form @submit.prevent="addBook" class="book-form">
				<div class="form-section">
					<h3>Book Details</h3>

					<div class="form-row">
						<div class="form-group">
							<label for="title">Book Title *</label>
							<input
								id="title"
								v-model="titleRef"
								type="text"
								placeholder="Enter the book title"
								required
								:disabled="loading"
							/>
						</div>

						<div class="form-group">
							<label for="author">Author *</label>
							<input
								id="author"
								v-model="authorRef"
								type="text"
								placeholder="Author's name"
								required
								:disabled="loading"
							/>
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="pages">Number of Pages</label>
							<input
								id="pages"
								v-model="pagesRef"
								type="number"
								placeholder="0"
								min="0"
								:disabled="loading"
							/>
						</div>

						<div class="form-group">
							<label for="status">Reading Status</label>
							<select id="status" v-model="statusRef" :disabled="loading">
								<option value="want-to-read">Want to Read</option>
								<option value="reading">Currently Reading</option>
								<option value="read">Completed</option>
							</select>
						</div>
					</div>
				</div>

				<div class="form-section">
					<h3>Book Cover</h3>

					<div class="cover-section">
						<div class="cover-preview">
							<img
								v-if="imageUrlFromISBN()"
								:src="imageUrlFromISBN()"
								alt="Book Cover Preview"
								class="cover-image"
								@error="handleImageError"
							/>
							<div v-else class="cover-placeholder">
								<i class="fas fa-book"></i>
								<span>No cover available</span>
							</div>
						</div>

						<div class="cover-controls">
							<div class="checkbox-group">
								<input
									id="useISBN"
									v-model="useISBNRef"
									type="checkbox"
									:disabled="loading"
								/>
								<label for="useISBN">Use ISBN to fetch cover automatically</label>
							</div>

							<div class="form-group">
								<label :for="useISBNRef ? 'isbn' : 'imageUrl'">
									{{ useISBNRef ? 'ISBN Number' : 'Image URL' }}
								</label>
								<input
									:id="useISBNRef ? 'isbn' : 'imageUrl'"
									v-model="imgUrlRef"
									type="text"
									:placeholder="useISBNRef ? '978-0-123456-78-9' : 'https://example.com/book-cover.jpg'"
									:disabled="loading"
								/>
							</div>
						</div>
					</div>
				</div>

				<div class="form-section">
					<h3>Reading Dates</h3>

					<div class="date-controls">
						<div class="date-group">
							<div class="checkbox-group">
								<input
									id="includeStartDate"
									v-model="includeStartDateRef"
									type="checkbox"
									:disabled="loading"
								/>
								<label for="includeStartDate">Set start date</label>
							</div>
							<div v-if="includeStartDateRef" class="form-group">
								<label for="startDate">Start Date</label>
								<input
									id="startDate"
									v-model="startDateRef"
									type="date"
									:disabled="loading"
								/>
							</div>
						</div>

						<div class="date-group">
							<div class="checkbox-group">
								<input
									id="includeEndDate"
									v-model="includeEndDateRef"
									type="checkbox"
									:disabled="loading"
								/>
								<label for="includeEndDate">Set completion date</label>
							</div>
							<div v-if="includeEndDateRef" class="form-group">
								<label for="endDate">End Date</label>
								<input
									id="endDate"
									v-model="endDateRef"
									type="date"
									:disabled="loading"
								/>
							</div>
						</div>
					</div>
				</div>

				<div v-if="err" class="error-message">
					<i class="fas fa-exclamation-circle"></i>
					Error adding book: {{ err.message }}
				</div>

				<div v-if="successMessage" class="success-message">
					<i class="fas fa-check-circle"></i>
					{{ successMessage }}
				</div>

				<div class="form-actions">
					<button type="button" @click="clearForm" class="secondary-button" :disabled="loading">
						<i class="fas fa-undo"></i>
						Clear Form
					</button>
					<button type="submit" class="primary-button" :disabled="loading || !isFormValid">
						<span v-if="loading" class="loading-spinner"></span>
						<i v-else class="fas fa-plus"></i>
						{{ loading ? 'Adding Book...' : 'Add Book' }}
					</button>
				</div>
			</form>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import Book from '../classes/Book.ts';
import type { BookInterface } from '../classes/Book.ts';
import type { ApiError } from '../lib/api';
import { syncBookColourIfMissing } from '../utils/bookColourSync';

const router = useRouter();

const titleRef = ref('');
const authorRef = ref('');
const useISBNRef = ref(false);
const imgUrlRef = ref('');
const pagesRef = ref('0');
const startDateRef = ref('');
const endDateRef = ref('');
const includeStartDateRef = ref(false);
const includeEndDateRef = ref(false);
const statusRef = ref('want-to-read');
const loading = ref(false);
const successMessage = ref('');

const err = ref<ApiError | null>(null);

const isFormValid = computed(() => {
	return titleRef.value.trim() && authorRef.value.trim();
});

function imageUrlFromISBN(): string {
	if (useISBNRef.value && imgUrlRef.value) {
		return `https://covers.openlibrary.org/b/isbn/${imgUrlRef.value}-L.jpg`;
	}
	return imgUrlRef.value;
}

function handleImageError() {
	// Could add fallback logic here
	console.warn('Failed to load book cover image');
}

function clearForm() {
	titleRef.value = '';
	authorRef.value = '';
	useISBNRef.value = false;
	imgUrlRef.value = '';
	pagesRef.value = '0';
	startDateRef.value = '';
	endDateRef.value = '';
	includeStartDateRef.value = false;
	includeEndDateRef.value = false;
	statusRef.value = 'want-to-read';
	err.value = null;
	successMessage.value = '';
}

async function addBook() {
	if (!isFormValid.value || loading.value) return;

	loading.value = true;
	err.value = null;
	successMessage.value = '';

	try {
		const title = titleRef.value.trim();
		const author = authorRef.value.trim();
		const image_url = imageUrlFromISBN();
		const pages = pagesRef.value || 0;
		const status = statusRef.value;

		let start_date: Date | null = null;
		let end_date: Date | null = null;

		if (includeStartDateRef.value && startDateRef.value) {
			start_date = new Date(startDateRef.value);
		}

		if (includeEndDateRef.value && endDateRef.value) {
			end_date = new Date(endDateRef.value);
		}

		const newBook: BookInterface = {
			title,
			author,
			image_url,
			start_date,
			end_date,
			id: null,
			pages,
			status,
			colour: null,
		};

		const book: Book = new Book(newBook);
		const error = await book.save();

		if (error) {
			err.value = error;
			console.error('Error adding book:', error);
			return;
		}

		await syncBookColourIfMissing(book);

		successMessage.value = 'Book added successfully!';

		// Clear form after successful addition
		setTimeout(() => {
			clearForm();
			// Optionally redirect to books page
			// router.push({ name: 'Books' });
		}, 2000);

	} catch (error) {
		console.error('Unexpected error:', error);
		err.value = { message: error instanceof Error ? error.message : 'Could not add book.' };
	} finally {
		loading.value = false;
	}
}
</script>

<style scoped>
.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32px;
	flex-wrap: wrap;
	gap: 16px;
}

.page-header h1 {
	margin: 0;
	color: var(--text);
	font-size: 2rem;
	font-weight: 700;
}

.import-button {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	background: var(--sec);
	color: var(--text);
	text-decoration: none;
	border-radius: 8px;
	font-weight: 500;
	transition: all 0.2s ease;
}

.import-button:hover {
	background: var(--accent);
	color: white;
	transform: translateY(-1px);
}

.book-form-container {
	background: var(--prim);
	border: 1px solid var(--sec);
	border-radius: 16px;
	padding: 32px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.book-form {
	display: flex;
	flex-direction: column;
	gap: 32px;
	max-width: 800px;
}

.form-section {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.form-section h3 {
	margin: 0;
	color: var(--text);
	font-size: 1.25rem;
	font-weight: 600;
	border-bottom: 2px solid var(--accent);
	padding-bottom: 8px;
}

.form-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
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

.form-group input,
.form-group select {
	padding: 12px 16px;
	border: 2px solid var(--sec);
	border-radius: 8px;
	font-size: 1rem;
	transition: all 0.2s ease;
	background: var(--prim);
	color: var(--text);
}

.form-group input:focus,
.form-group select:focus {
	outline: none;
	border-color: var(--accent);
	box-shadow: 0 0 0 3px rgba(205, 92, 92, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.form-group input::placeholder {
	color: var(--secondary-text);
}

.cover-section {
	display: grid;
	grid-template-columns: 200px 1fr;
	gap: 24px;
	align-items: start;
}

.cover-preview {
	display: flex;
	justify-content: center;
	align-items: center;
	background: var(--sec);
	border-radius: 12px;
	min-height: 280px;
	padding: 16px;
}

.cover-image {
	max-width: 160px;
	max-height: 240px;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	object-fit: cover;
}

.cover-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	color: var(--secondary-text);
	text-align: center;
}

.cover-placeholder i {
	font-size: 2rem;
	color: var(--secondary-text);
}

.cover-controls {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.checkbox-group {
	display: flex;
	align-items: center;
	gap: 8px;
}

.checkbox-group input[type="checkbox"] {
	width: 18px;
	height: 18px;
	accent-color: var(--accent);
	cursor: pointer;
}

.checkbox-group label {
	cursor: pointer;
	color: var(--text);
	font-weight: 500;
	margin: 0;
}

.date-controls {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 24px;
}

.date-group {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.error-message {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 16px;
	background: #fee2e2;
	border: 1px solid #fecaca;
	border-radius: 8px;
	color: #dc2626;
	font-weight: 500;
}

.success-message {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 16px;
	background: #d1fae5;
	border: 1px solid #a7f3d0;
	border-radius: 8px;
	color: #065f46;
	font-weight: 500;
}

.form-actions {
	display: flex;
	justify-content: flex-end;
	gap: 16px;
	padding-top: 24px;
	border-top: 1px solid var(--sec);
}

.primary-button,
.secondary-button {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 14px 20px;
	border: none;
	border-radius: 8px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	min-height: 48px;
	min-width: 140px;
	justify-content: center;
}

.primary-button {
	background: var(--accent);
	color: white;
}

.primary-button:hover:not(:disabled) {
	background: #b91c1c;
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(205, 92, 92, 0.3);
}

.secondary-button {
	background: var(--sec);
	color: var(--text);
}

.secondary-button:hover:not(:disabled) {
	background: var(--secondary-text);
	color: white;
}

.primary-button:disabled,
.secondary-button:disabled {
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

/* Responsive Design */
@media (max-width: 768px) {
	.page-header {
		flex-direction: column;
		align-items: stretch;
		text-align: center;
	}

	.book-form-container {
		padding: 24px 16px;
	}

	.form-row {
		grid-template-columns: 1fr;
	}

	.cover-section {
		grid-template-columns: 1fr;
		gap: 16px;
	}

	.cover-preview {
		min-height: 200px;
	}

	.date-controls {
		grid-template-columns: 1fr;
	}

	.form-actions {
		flex-direction: column-reverse;
	}

	.primary-button,
	.secondary-button {
		width: 100%;
	}
}

@media (max-width: 480px) {
	.page-header h1 {
		font-size: 1.75rem;
	}

	.book-form-container {
		padding: 16px;
	}

	.form-section {
		gap: 16px;
	}
}
</style>
