import { api, type ApiError } from '../lib/api';
export interface BookInterface {
	id: string | null;
	title: string;
	author: string;
	start_date: Date | string | null;
	end_date: Date | string | null;
	creation_date?: Date | null;
	created_at?: string;
	image_url: string | null;
	status: string;
	pages: number | string;
	colour?: string | null;
}

export default class Book {
	public id: string | null;
	public title: string;
	public author: string;
	public start_date: Date | null;
	public end_date: Date | null
	public image_url: string | null;
	public status: string;
	public pages: number;
	public creation_date: Date | null;
	public colour: string | null;

	public static parseDate(date: Date | string | null): Date | null {
		if (date === null) {
			return null;
		}
		if (date instanceof Date) {
			return date;
		}
		const parsedDate = new Date(date);
		return isNaN(parsedDate.getTime()) ? null : parsedDate;
	}

	public constructor(book: BookInterface) {
		this.id = book.id;
		this.title = book.title;
		this.author = book.author;
		this.start_date = Book.parseDate(book.start_date);
		this.end_date = Book.parseDate(book.end_date);
		this.creation_date = Book.parseDate(book.created_at || book.creation_date || null);
		this.image_url = book.image_url;
		this.status = book.status;
		this.colour = book.colour ?? null;
		if (typeof book.pages === 'string') {
			this.pages = parseInt(book.pages, 10);
		} else {
			this.pages = book.pages;
		}
	}

	public async delete(): Promise<ApiError | string | null> {
		if (this.id === null) {
			console.error('Cannot delete a book without an ID.');
			return 'Cannot delete a book without an ID.';
		}

		const { error } = await api.deleteBook(this.id);
		if (error) {
			console.error('Error deleting book:', error);
			return error;
		}
		return null;
	}

	public async save(): Promise<ApiError | null> {
		const book = {
			title: this.title,
			author: this.author,
			start_date: Book.getDateISOString(this.start_date),
			end_date: Book.getDateISOString(this.end_date),
			image_url: this.image_url,
			status: this.status,
			pages: this.pages,
			colour: this.colour,
		};
		const { data, error } = this.id === null
			? await api.createBook(book)
			: await api.updateBook(this.id, book);
		if (error) {
			console.error('Error saving book:', error);
			return error;
		}
		this.id = data.id;
		this.creation_date = Book.parseDate(data.created_at || null);
		return null;
	}

	public static getDateISOString(date: Date | null): string | null {
		return date ? date.toISOString() : null;
	}

	// basic getters
	public getUid(): string | null { return this.id; }
	public getTitle(): string { return this.title; }
	public getAuthor(): string { return this.author; }
	public getStartDate(): Date | null { return this.start_date; }
	public getEndDate(): Date | null { return this.end_date; }
	public getCreationDate(): Date | null { return this.creation_date; }
	public getImageUrl(): string | null {
		return this.image_url;
	}
	public getPages(): number { return this.pages; }
	public getStatus(): string { return this.status; }
	public getColour(): string | null { return this.colour; }

	// basic setters

	public setTitle(title: string): void { this.title = title; }
	public setAuthor(author: string): void { this.author = author; }
	public setStartDate(start_date: Date | null): void { this.start_date = start_date; }
	public setEndDate(end_date: Date | null): void { this.end_date = end_date; }
	public setImageUrl(image_url: string | null): void { this.image_url = image_url; }
	public setStatus(status: string): void { this.status = status; }
	public setColour(colour: string | null): void { this.colour = colour; }
	public setPages(pages: number | string): void {
		if (typeof pages === 'string') {
			this.pages = parseInt(pages, 10);
		} else {
			this.pages = pages;
		}
	}
}
