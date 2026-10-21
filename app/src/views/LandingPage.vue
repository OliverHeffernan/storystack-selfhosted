<template>
	<div class="landing-page">
		<!-- Hero Section -->
		<section class="hero">
			<div class="marginsLanding">
				<div class="hero-content">
					<div class="hero-text">
						<h1 class="hero-title">
							Track Your Reading Journey with
							<span class="accent-text">StoryStack</span>
						</h1>
						<p class="hero-subtitle">
							Discover, organize, and celebrate your love for books.
							Keep track of what you're reading, what you've finished, and what's next on your list.
						</p>
						<div class="hero-actions">
							<RouterLink to="/signup" class="cta-button primary">
								<i class="fas fa-rocket"></i>
								Start Your Journey
							</RouterLink>
							<RouterLink to="/signin" class="cta-button secondary">
								<i class="fas fa-sign-in-alt"></i>
								Sign In
							</RouterLink>
						</div>
					</div>

					<div class="hero-visual">
						<div class="book-stack">
							<div class="book book-1" data-title="The Great Gatsby">📘</div>
							<div class="book book-2" data-title="1984">📗</div>
							<div class="book book-3" data-title="Pride & Prejudice">📕</div>
							<div class="book book-4" data-title="To Kill a Mockingbird">📙</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Features Section -->
		<section class="features">
			<div class="marginsLanding">
				<h2 class="features-title">Everything You Need to Manage Your Books</h2>

				<div class="features-grid">
					<div class="feature-card">
						<div class="feature-icon">📚</div>
						<h3>Organize Your Library</h3>
						<p>Keep track of all your books with custom statuses: Want to Read, Reading, and Completed.</p>
					</div>

					<div class="feature-card">
						<div class="feature-icon">📊</div>
						<h3>Reading Analytics</h3>
						<p>View your reading progress with beautiful stats and insights about your reading habits.</p>
					</div>

					<div class="feature-card">
						<div class="feature-icon">🎯</div>
						<h3>Set Reading Goals</h3>
						<p>Track your reading dates and see how many books you've completed each month or year.</p>
					</div>

					<div class="feature-card">
						<div class="feature-icon">📱</div>
						<h3>Mobile Friendly</h3>
						<p>Access your library anywhere with our responsive design that works on all devices.</p>
					</div>

					<div class="feature-card">
						<div class="feature-icon">⚡</div>
						<h3>Quick Import</h3>
						<p>Import your existing library from Goodreads with just a few clicks.</p>
					</div>

					<div class="feature-card">
						<div class="feature-icon">🎨</div>
						<h3>Beautiful Interface</h3>
						<p>Enjoy a clean, modern interface designed to make managing your books a pleasure.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Demo Section -->
		<section class="demo">
			<div class="marginsLanding">
				<div class="demo-container">
					<div class="demo-content">
						<h2>See StoryStack in Action</h2>
						<p>Experience how easy it is to manage your reading collection</p>

						<div class="demo-features">
							<div class="demo-feature">
								<div class="demo-icon">📖</div>
								<div>
									<h4>Card & List Views</h4>
									<p>Switch between visual cards and detailed list views</p>
								</div>
							</div>

							<div class="demo-feature">
								<div class="demo-icon">📈</div>
								<div>
									<h4>Progress Tracking</h4>
									<p>Monitor your reading habits with detailed statistics</p>
								</div>
							</div>

							<div class="demo-feature">
								<div class="demo-icon">🏷️</div>
								<div>
									<h4>Smart Organization</h4>
									<p>Filter and organize books by status, author, or date</p>
								</div>
							</div>
						</div>
					</div>

					<div class="demo-visual">
						<div class="demo-mockup">
							<div class="mockup-header">
								<div class="mockup-dots">
									<span></span><span></span><span></span>
								</div>
								<span class="mockup-title">StoryStack</span>
							</div>
							<div class="mockup-content">
								<div class="mockup-stats">
									<div class="stat-card mini">
										<div class="stat-number">23</div>
										<div class="stat-label">Books Read</div>
									</div>
									<div class="stat-card mini">
										<div class="stat-number">4,892</div>
										<div class="stat-label">Pages</div>
									</div>
								</div>
								<div class="mockup-books">
									<div class="mini-book-card">📘 The Great Gatsby</div>
									<div class="mini-book-card">📗 To Kill a Mockingbird</div>
									<div class="mini-book-card">📕 Pride and Prejudice</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- CTA Section -->
		<section class="cta">
			<div class="marginsLanding">
				<h2>Ready to Start Your Reading Journey?</h2>
				<p>Join readers who use StoryStack to organize and track their books</p>

				<div class="cta-actions">
					<RouterLink to="/signup" class="cta-button primary large">
						<i class="fas fa-user-plus"></i>
						Create Free Account
					</RouterLink>
					<p class="cta-note">No credit card required • Start organizing immediately</p>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<footer class="footer">
			<div class="marginsLanding">
				<div class="footer-container">
					<div class="footer-brand">
						<h3>StoryStack</h3>
						<p>Your personal reading companion</p>
					</div>

					<div class="footer-links">
						<div class="footer-section">
							<h4>Product</h4>
							<RouterLink to="/signup">Sign Up</RouterLink>
							<RouterLink to="/signin">Sign In</RouterLink>
						</div>
					</div>
				</div>
			</div>

			<div class="footer-bottom">
				<div class="marginsLanding">
					<p>StoryStack - Your personal reading companion</p>
				</div>
			</div>
		</footer>
	</div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.landing-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Hero Section */
.hero {
	padding: 80px 0 120px;
	min-height: 100vh;
	display: flex;
	align-items: center;
	position: relative;
	overflow: hidden;
}

.hero-content {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 60px;
	align-items: center;
}

.hero-title {
	font-size: 3.5rem;
	font-weight: 800;
	line-height: 1.1;
	color: var(--text);
	margin: 0 0 24px 0;
}

.accent-text {
	color: var(--accent);
	background: linear-gradient(135deg, var(--accent), #e85a5a);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.hero-subtitle {
	font-size: 1.25rem;
	line-height: 1.6;
	color: var(--secondary-text);
	margin: 0 0 32px 0;
}

.hero-actions {
	display: flex;
	gap: 16px;
	flex-wrap: wrap;
}

.cta-button {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 16px 32px;
	border-radius: 12px;
	font-size: 1.1rem;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.3s ease;
	border: 2px solid transparent;
}

.cta-button.primary {
	background: var(--accent);
	color: white;
}

.cta-button.primary:hover {
	background: #b91c1c;
	transform: translateY(-2px);
	box-shadow: 0 8px 25px rgba(205, 92, 92, 0.3);
}

.cta-button.secondary {
	background: transparent;
	color: var(--text);
	border-color: var(--sec);
}

.cta-button.secondary:hover {
	background: var(--text);
	color: white;
	transform: translateY(-2px);
}

.cta-button.large {
	padding: 20px 40px;
	font-size: 1.2rem;
}

/* Hero Visual */
.hero-visual {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 400px;
}

.book-stack {
	position: relative;
	animation: float 3s ease-in-out infinite;
}

.book {
	width: 80px;
	height: 100px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 3rem;
	border-radius: 8px;
	box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	position: absolute;
	transition: box-shadow 0.3s ease;
	cursor: pointer;
}

.book:hover {
	box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
}

.book-1 {
	transform: rotate(-15deg) translateX(-120px);
	z-index: 4;
}

.book-2 {
	transform: rotate(-5deg) translateX(-50px);
	z-index: 3;
}

.book-3 {
	transform: rotate(5deg) translateX(50px);
	z-index: 2;
}

.book-4 {
	transform: rotate(15deg) translateX(120px);
	z-index: 1;
}

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10px); }
}

@keyframes gentle-float {
	0%, 100% { transform: translateY(0) rotate(0deg); }
	33% { transform: translateY(-8px) rotate(2deg); }
	66% { transform: translateY(4px) rotate(-1deg); }
}

/* Features Section */
.features {
	padding: 100px 0;
	background: var(--prim);
}

.features-title {
	text-align: center;
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--text);
	margin: 0 0 60px 0;
}

.features-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
	gap: 32px;
}

.feature-card {
	background: var(--prim);
	border: 1px solid var(--sec);
	border-radius: 16px;
	padding: 32px;
	text-align: center;
	transition: all 0.3s ease;
}

.feature-card:hover {
	transform: translateY(-8px);
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	border-color: var(--accent);
}

.feature-icon {
	font-size: 3rem;
	margin-bottom: 16px;
}

.feature-card h3 {
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--text);
	margin: 0 0 12px 0;
}

.feature-card p {
	color: var(--secondary-text);
	line-height: 1.6;
	margin: 0;
}

/* Demo Section */
.demo {
	padding: 100px 0;
	background: linear-gradient(135deg, var(--accent), #e85a5a);
	color: white;
}

.demo-container {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 60px;
	align-items: center;
}

.demo-content h2 {
	font-size: 2.5rem;
	font-weight: 700;
	margin: 0 0 16px 0;
}

.demo-content p {
	color: rgba(255, 255, 255, 0.95);
	font-size: 1.2rem;
	opacity: 0.9;
	margin: 0 0 32px 0;
}

.demo-features {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.demo-feature {
	display: flex;
	align-items: center;
	gap: 16px;
}

.demo-icon {
	font-size: 2rem;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 12px;
	width: 60px;
	height: 60px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.demo-feature h4 {
	margin: 0 0 4px 0;
	font-size: 1.1rem;
	font-weight: 600;
}

.demo-feature p {
	margin: 0;
	color: rgba(255, 255, 255, 0.95);
	font-size: 0.9rem;
}

/* Demo Mockup */
.demo-mockup {
	background: white;
	border-radius: 16px;
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
	overflow: hidden;
	transform: rotate(-5deg);
	transition: transform 0.3s ease;
}

.demo-mockup:hover {
	transform: rotate(0deg) scale(1.05);
}

.mockup-header {
	background: var(--sec);
	padding: 16px;
	display: flex;
	align-items: center;
	gap: 12px;
}

.mockup-dots {
	display: flex;
	gap: 4px;
}

.mockup-dots span {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--secondary-text);
}

.mockup-title {
	font-weight: 600;
	color: var(--text);
	font-size: 0.9rem;
}

.mockup-content {
	padding: 20px;
	color: var(--text);
}

.mockup-stats {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;
}

.stat-card.mini {
	flex: 1;
	background: var(--sec);
	padding: 12px;
	border-radius: 8px;
	text-align: center;
}

.stat-number {
	font-size: 1.2rem;
	font-weight: 700;
	color: var(--accent);
}

.stat-label {
	font-size: 0.7rem;
	color: var(--secondary-text);
	margin-top: 2px;
}

.mockup-books {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.mini-book-card {
	background: var(--prim);
	border: 1px solid var(--sec);
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 0.8rem;
	color: var(--text);
}

/* CTA Section */
.cta {
	padding: 100px 0;
	background: var(--prim);
	text-align: center;
}

.cta h2 {
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--text);
	margin: 0 0 16px 0;
}

.cta p {
	font-size: 1.2rem;
	color: var(--secondary-text);
	margin: 0 0 32px 0;
}

.cta-actions {
	margin-bottom: 48px;
}

.cta-note {
	padding-top: 30px;
	font-size: 0.9rem;
	color: var(--secondary-text);
}

/* Footer */
.footer {
	background: var(--text);
	color: white;
	padding: 60px 0 20px;
}

.footer-container {
	display: grid;
	grid-template-columns: 1fr 2fr;
	gap: 60px;
}

.footer-brand h3 {
	font-size: 1.5rem;
	margin: 0 0 8px 0;
}

.footer-brand p {
	opacity: 0.8;
	margin: 0;
}

.footer-links {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 32px;
}

.footer-section h4 {
	margin: 0 0 16px 0;
	font-weight: 600;
}

.footer-section a {
	display: block;
	color: white;
	text-decoration: none;
	opacity: 0.8;
	margin-bottom: 8px;
	transition: opacity 0.2s ease;
}

.footer-section a:hover {
	opacity: 1;
}

.footer-bottom {
	border-top: 1px solid rgba(255, 255, 255, 0.2);
	margin-top: 40px;
	padding-top: 20px;
	text-align: center;
	opacity: 0.6;
}

/* Responsive Design */
@media (max-width: 768px) {
	.hero-content {
		grid-template-columns: 1fr;
		text-align: center;
		gap: 40px;
	}

	.hero-title {
		font-size: 2.5rem;
	}

	.demo-container {
		grid-template-columns: 1fr;
		text-align: center;
	}

	.features-grid {
		grid-template-columns: 1fr;
	}

	.footer-container {
		grid-template-columns: 1fr;
		text-align: center;
		gap: 40px;
	}

	.book-stack {
		transform: scale(0.8);
	}

	.cta-button {
		width: 100%;
		justify-content: center;
	}
}

@media (max-width: 480px) {
	.hero-title {
		font-size: 2rem;
	}

	.features-title {
		font-size: 2rem;
	}

	.demo-content h2 {
		font-size: 2rem;
	}

	.cta h2 {
		font-size: 2rem;
	}

	.hero {
		padding: 40px 0 60px;
	}
}
</style>
