<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import Popup from './Popup.vue';
import Book from '../classes/Book.ts';
import type { ApiError } from '../lib/api';

const props = defineProps<{
	book: Book;
	editing: boolean;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'update', book: Book): void;
	(e: 'delete', bookId: string): void;
}>();

const titleRef = ref('');
const authorRef = ref('');
const imgUrlRef = ref('');
const pagesRef = ref('0');
const startDateRef = ref('');
const endDateRef = ref('');
const includeStartDateRef = ref(false);
const includeEndDateRef = ref(false);
const statusRef = ref('want-to-read');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const isFormValid = computed(() => {
	return titleRef.value.trim() && authorRef.value.trim();
});

onMounted(() => {
	titleRef.value = props.book.getTitle();
	authorRef.value = props.book.getAuthor();
	imgUrlRef.value = props.book.getImageUrl() || '';
	pagesRef.value = props.book.getPages().toString();

	const startDate: Date | null = props.book.getStartDate();
	if (startDate !== null) {
		includeStartDateRef.value = true;
		startDateRef.value = startDate.toISOString().substring(0, 10);
	}

	const endDate: Date | null = props.book.getEndDate();
	if (endDate) {
		includeEndDateRef.value = true;
		endDateRef.value = endDate.toISOString().substring(0, 10);
	}

	statusRef.value = props.book.getStatus();
});

function newDate(dateStr: string): Date | null {
	if (!dateStr) return null;
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) {
		return null;
	}
	return date;
}

async function removeBook() {
	if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
		return;
	}

	loading.value = true;
	errorMessage.value = '';

	try {
		const error: ApiError | string | null = await props.book.delete();
		if (error) {
			errorMessage.value = typeof error === 'string' ? error : error.message;
			return;
		}
		emit('delete', props.book.getUid() || '');
	} catch (error) {
		errorMessage.value = 'Failed to delete book';
		console.error('Error deleting book:', error);
	} finally {
		loading.value = false;
	}
}

async function updateBook() {
	if (!isFormValid.value || loading.value) return;

	loading.value = true;
	errorMessage.value = '';
	successMessage.value = '';

	try {
		const updatedBook: Book = props.book;
		updatedBook.setTitle(titleRef.value.trim());
		updatedBook.setAuthor(authorRef.value.trim());
		const previousImageUrl = updatedBook.getImageUrl() || '';
		const nextImageUrl = imgUrlRef.value.trim();
		updatedBook.setImageUrl(nextImageUrl);
		updatedBook.setPages(pagesRef.value);
		if (previousImageUrl !== nextImageUrl) {
			updatedBook.setColour(null);
		}

		if (includeStartDateRef.value && startDateRef.value) {
			updatedBook.setStartDate(newDate(startDateRef.value));
		} else {
			updatedBook.setStartDate(null);
		}

		if (includeEndDateRef.value && endDateRef.value) {
			updatedBook.setEndDate(newDate(endDateRef.value));
		} else {
			updatedBook.setEndDate(null);
		}

		updatedBook.setStatus(statusRef.value);

		const error = await updatedBook.save();
		if (error) {
			errorMessage.value = error.message;
			return;
		}

		successMessage.value = 'Book updated successfully!';
		setTimeout(() => {
			emit('update', updatedBook);
		}, 1000);

	} catch (error) {
		errorMessage.value = 'Failed to update book';
		console.error('Error updating book:', error);
	} finally {
		loading.value = false;
	}
}
</script>

<style scoped>
.edit-container {
	width: 100%;
	max-width: 600px;
	max-height: 90vh;
	overflow-y: auto;
	-webkit-overflow-scrolling: touch;
}

@media (max-width: 768px) {
	.edit-container {
		max-height: none;
		height: auto;
	}
}

.edit-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 2px solid var(--sec);
}

.edit-header h2 {
	margin: 0;
	color: var(--text);
	font-size: 1.5rem;
	font-weight: 700;
}

.close-button {
	background: var(--sec);
	border: none;
	border-radius: 50%;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	color: var(--text);
	transition: all 0.2s ease;
}

.close-button:hover:not(:disabled) {
	background: #dc2626;
	color: white;
}

.close-button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.edit-form {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.form-section {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.form-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.form-group label {
	font-weight: 600;
	color: var(--text);
	font-size: 0.9rem;
}

.form-group input,
.form-group select {
	padding: 10px 12px;
	border: 2px solid var(--sec);
	border-radius: 6px;
	font-size: 0.95rem;
	transition: all 0.2s ease;
	background: var(--prim);
	color: var(--text);
}

.form-group input:focus,
.form-group select:focus {
	outline: none;
	border-color: var(--accent);
	box-shadow: 0 0 0 2px rgba(205, 92, 92, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.cover-section {
	display: grid;
	grid-template-columns: 120px 1fr;
	gap: 16px;
	align-items: start;
}

.cover-preview {
	display: flex;
	justify-content: center;
	align-items: center;
	background: var(--sec);
	border-radius: 8px;
	min-height: 160px;
	padding: 12px;
}

.cover-image {
	max-width: 96px;
	max-height: 144px;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	object-fit: cover;
}

.cover-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	color: var(--secondary-text);
	text-align: center;
}

.cover-placeholder i {
	font-size: 1.5rem;
}

.cover-placeholder span {
	font-size: 0.8rem;
}

.date-section h4 {
	margin: 0 0 12px 0;
	color: var(--text);
	font-size: 1.1rem;
	font-weight: 600;
}

.date-controls {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
}

.date-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.checkbox-group {
	display: flex;
	align-items: center;
	gap: 6px;
}

.checkbox-group input[type="checkbox"] {
	width: 16px;
	height: 16px;
	accent-color: var(--accent);
	cursor: pointer;
}

.checkbox-group label {
	cursor: pointer;
	color: var(--text);
	font-weight: 500;
	margin: 0;
	font-size: 0.9rem;
}

.error-message {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	background: #fee2e2;
	border: 1px solid #fecaca;
	border-radius: 6px;
	color: #dc2626;
	font-size: 0.9rem;
}

.success-message {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	background: #d1fae5;
	border: 1px solid #a7f3d0;
	border-radius: 6px;
	color: #065f46;
	font-size: 0.9rem;
}

.form-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	padding-top: 20px;
	border-top: 1px solid var(--sec);
}

.action-group {
	display: flex;
	gap: 12px;
}

.primary-button,
.secondary-button,
.delete-button {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 10px 16px;
	border: none;
	border-radius: 6px;
	font-size: 0.9rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	min-height: 40px;
	min-width: 100px;
	justify-content: center;
}

.primary-button {
	background: var(--accent);
	color: white;
}

.primary-button:hover:not(:disabled) {
	background: #b91c1c;
	transform: translateY(-1px);
}

.secondary-button {
	background: var(--sec);
	color: var(--text);
}

.secondary-button:hover:not(:disabled) {
	background: var(--secondary-text);
	color: white;
}

.delete-button {
	background: #dc2626;
	color: white;
}

.delete-button:hover:not(:disabled) {
	background: #991b1b;
	transform: translateY(-1px);
}

.primary-button:disabled,
.secondary-button:disabled,
.delete-button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
	transform: none;
}

.loading-spinner {
	width: 16px;
	height: 16px;
	border: 2px solid transparent;
	border-top: 2px solid currentColor;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 640px) {
	.form-row {
		grid-template-columns: 1fr;
	}

	.cover-section {
		grid-template-columns: 1fr;
		text-align: center;
	}

	.date-controls {
		grid-template-columns: 1fr;
	}

	.form-actions {
		flex-direction: column;
		gap: 16px;
		padding: 16px 0 0 0;
		border-top: 1px solid var(--sec);
		background: white;
	}

	.action-group {
		width: 100%;
		flex-direction: column-reverse;
	}

	.primary-button,
	.secondary-button {
		width: 100%;
	}

	.delete-button {
		width: 100%;
	}
}
</style>
<template>
	<Popup @close="emit('close')">
		<div class="edit-container">
			<div class="edit-header">
				<h2>Edit Book</h2>
				<button class="close-button" @click="emit('close')" :disabled="loading">
					<i class="fas fa-times"></i>
				</button>
			</div>

			<form @submit.prevent="updateBook" class="edit-form">
				<div class="form-section">
					<div class="form-row">
						<div class="form-group">
							<label for="editTitle">Book Title *</label>
							<input
								id="editTitle"
								v-model="titleRef"
								type="text"
								placeholder="Enter book title"
								required
								:disabled="loading"
							/>
						</div>

						<div class="form-group">
							<label for="editAuthor">Author *</label>
							<input
								id="editAuthor"
								v-model="authorRef"
								type="text"
								placeholder="Author name"
								required
								:disabled="loading"
							/>
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="editPages">Pages</label>
							<input
								id="editPages"
								v-model="pagesRef"
								type="number"
								placeholder="0"
								min="0"
								:disabled="loading"
							/>
						</div>

						<div class="form-group">
							<label for="editStatus">Status</label>
							<select id="editStatus" v-model="statusRef" :disabled="loading">
								<option value="want-to-read">Want to Read</option>
								<option value="reading">Currently Reading</option>
								<option value="read">Completed</option>
							</select>
						</div>
					</div>

					<div class="cover-section">
						<div class="cover-preview">
							<img
								v-if="imgUrlRef"
								:src="imgUrlRef"
								alt="Book Cover"
								class="cover-image"
							/>
							<div v-else class="cover-placeholder">
								<i class="fas fa-book"></i>
								<span>No cover</span>
							</div>
						</div>

						<div class="form-group">
							<label for="editImageUrl">Cover Image URL</label>
							<input
								id="editImageUrl"
								v-model="imgUrlRef"
								type="text"
								placeholder="https://example.com/cover.jpg"
								:disabled="loading"
							/>
						</div>
					</div>

					<div class="date-section">
						<h4>Reading Dates</h4>

						<div class="date-controls">
							<div class="date-group">
								<div class="checkbox-group">
									<input
										id="editIncludeStartDate"
										v-model="includeStartDateRef"
										type="checkbox"
										:disabled="loading"
									/>
									<label for="editIncludeStartDate">Set start date</label>
								</div>
								<div v-if="includeStartDateRef" class="form-group">
									<input
										v-model="startDateRef"
										type="date"
										:disabled="loading"
									/>
								</div>
							</div>

							<div class="date-group">
								<div class="checkbox-group">
									<input
										id="editIncludeEndDate"
										v-model="includeEndDateRef"
										type="checkbox"
										:disabled="loading"
									/>
									<label for="editIncludeEndDate">Set completion date</label>
								</div>
								<div v-if="includeEndDateRef" class="form-group">
									<input
										v-model="endDateRef"
										type="date"
										:disabled="loading"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div v-if="errorMessage" class="error-message">
					<i class="fas fa-exclamation-circle"></i>
					{{ errorMessage }}
				</div>

				<div v-if="successMessage" class="success-message">
					<i class="fas fa-check-circle"></i>
					{{ successMessage }}
				</div>

				<div class="form-actions">
					<button
						type="button"
						@click="removeBook"
						class="delete-button"
						:disabled="loading"
					>
						<i v-if="loading" class="loading-spinner"></i>
						<i v-else class="fas fa-trash"></i>
						Delete Book
					</button>

					<div class="action-group">
						<button
							type="button"
							@click="emit('close')"
							class="secondary-button"
							:disabled="loading"
						>
							Cancel
						</button>

						<button
							type="submit"
							class="primary-button"
							:disabled="loading || !isFormValid"
						>
							<span v-if="loading" class="loading-spinner"></span>
							<i v-else class="fas fa-save"></i>
							{{ loading ? 'Saving...' : 'Save Changes' }}
						</button>
					</div>
				</div>
			</form>
		</div>
	</Popup>
</template>
