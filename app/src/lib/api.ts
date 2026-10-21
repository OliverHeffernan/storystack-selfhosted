import type { BookInterface } from '../classes/Book';

export interface User {
  id: string;
  email: string;
  user_metadata: { display_name?: string; [key: string]: unknown };
}
export interface ApiError { message: string; status?: number }
type Result<T> = { data: T; error: null } | { data: null; error: ApiError };
type BookInput = Pick<BookInterface, 'title' | 'author' | 'start_date' | 'end_date' | 'image_url' | 'status' | 'pages' | 'colour'>;

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<Result<T>> {
  try {
    const response = await fetch(`/api${path}`, {
      method, credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return { data: undefined as T, error: null };
    const data = await response.json();
    if (!response.ok) return { data: null, error: { message: data.message || 'The request failed.', status: response.status } };
    return { data: data as T, error: null };
  } catch {
    return { data: null, error: { message: 'Could not reach StoryStack. Please try again.' } };
  }
}

export const api = {
  me: () => request<User>('/auth/me'),
  signIn: (email: string, password: string) => request<User>('/auth/signin', 'POST', { email, password }),
  signUp: (email: string, password: string, display_name: string) => request<User>('/auth/signup', 'POST', { email, password, display_name }),
  signOut: () => request<void>('/auth/signout', 'POST'),
  listBooks: () => request<BookInterface[]>('/books'),
  createBook: (book: BookInput) => request<BookInterface>('/books', 'POST', book),
  updateBook: (id: string, book: Partial<BookInput>) => request<BookInterface>(`/books/${encodeURIComponent(id)}`, 'PATCH', book),
  deleteBook: (id: string) => request<void>(`/books/${encodeURIComponent(id)}`, 'DELETE'),
  importBooks: (data: string) => request<{ success: boolean; inserted: number; total: number }>('/books/import', 'POST', { data }),
};
