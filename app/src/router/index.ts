import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import SignIn from '../views/SignIn.vue'
import SignUp from '../views/SignUp.vue'
import Home from '../views/Home.vue'
import Books from '../views/Books.vue'
import AddBook from '../views/AddBook.vue'
import ImportBooks from '../views/ImportBooks.vue'
import { api } from '../lib/api'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			name: 'Landing',
			path: '/',
			component: LandingPage,
		},
		{
			name: 'Home',
			path: '/app',
			component: Home,
		},
		{
			name: 'Sign In',
			path: '/signin',
			component: SignIn,
		},
		{
			name: 'Sign Up',
			path: '/signup',
			component: SignUp,
		},
		{
			path: '/confirm-email',
			redirect: { name: 'Sign In', hash: '' },
		},
		{
			name: 'Books',
			path: '/app/books',
			component: Books,
		},
		{
			name: 'Add Book',
			path: '/app/books/add',
			component: AddBook,
		},
		{
			name: 'Import Books',
			path: '/app/books/import',
			component: ImportBooks,
		}
	],
})

router.beforeEach(async (to) => {
	if (to.path === '/app' || to.path.startsWith('/app/')) {
		const { error } = await api.me();
		if (error) return { name: 'Sign In' };
	}
})

export default router
