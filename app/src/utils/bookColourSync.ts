import { api } from '../lib/api';
import Book from '../classes/Book';
import {
	DEFAULT_BOOK_COLOUR_SENTINEL,
	extractDominantHexFromImageUrl,
	isHexColour,
} from './dominantColor';

const MAX_CONCURRENT_JOBS = 4;

async function updateBookColourById(bookId: string, colour: string): Promise<void> {
	const { error } = await api.updateBook(bookId, { colour });

	if (error) {
		console.error('Failed to update book colour:', error);
	}
}

async function resolveAndPersistBookColour(book: Book): Promise<void> {
	const currentColour = book.getColour();
	if (currentColour === DEFAULT_BOOK_COLOUR_SENTINEL || isHexColour(currentColour)) {
		return;
	}

	const bookId = book.getUid();
	if (!bookId) {
		return;
	}

	const imageUrl = book.getImageUrl();
	const extractedHex = imageUrl ? await extractDominantHexFromImageUrl(imageUrl) : null;
	const colourToStore = extractedHex ?? DEFAULT_BOOK_COLOUR_SENTINEL;

	book.setColour(colourToStore);
	await updateBookColourById(bookId, colourToStore);
}

export async function syncBookColourIfMissing(book: Book): Promise<void> {
	await resolveAndPersistBookColour(book);
}

export async function syncMissingBookColours(books: Book[]): Promise<void> {
	const pendingBooks = books.filter((book) => {
		const colour = book.getColour();
		return colour !== DEFAULT_BOOK_COLOUR_SENTINEL && !isHexColour(colour);
	});

	if (!pendingBooks.length) return;

	let index = 0;
	const workers = Array.from({ length: Math.min(MAX_CONCURRENT_JOBS, pendingBooks.length) }, async () => {
		while (index < pendingBooks.length) {
			const currentIndex = index;
			index += 1;
			const book = pendingBooks[currentIndex];
			if (!book) continue;
			await resolveAndPersistBookColour(book);
		}
	});

	await Promise.all(workers);
}
