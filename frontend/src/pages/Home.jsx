import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import cakeLogo from '../images_cake/cake_logo.jpeg';

export default function Home() {
	const [stats, setStats] = useState({ completedOrders:0 , totalReviews: 0 })
	const [reviews, setReviews] = useState([])
	const [showReviewForm, setShowReviewForm] = useState(false)
	const [reviewForm, setReviewForm] = useState({
		name: '',
		rating: 5,
		comment: ''
	})
	const [submitStatus, setSubmitStatus] = useState('')
	const [currentSlide, setCurrentSlide] = useState(0)

	useEffect(() => {
		// Load analytics for completed orders count
		fetch('/api/analytics')
			.then(res => res.json())
			.then(data => setStats(prev => ({ ...prev, completedOrders: data.completedOrders + 500 })))
			.catch(err => console.error('Failed to load analytics'))

		// Load pinned reviews only
		fetch('/api/reviews')
			.then(res => res.json())
			.then(data => {
				const pinnedReviews = data.filter(review => review.pinned)
				setReviews(pinnedReviews)
				setStats(prev => ({ ...prev, totalReviews: data.length }))
			})
			.catch(err => console.error('Failed to load reviews'))
	}, [])

	const handleReviewSubmit = async (e) => {
		e.preventDefault()
		setSubmitStatus('submitting')

		try {
			const res = await fetch('/api/reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(reviewForm)
			})

			if (res.ok) {
				setSubmitStatus('success')
				setReviewForm({ name: '', rating: 5, comment: '' })
				setShowReviewForm(false)
				// Note: New reviews are not pinned by default, so they won't show on homepage
				// Admin needs to pin them manually
			} else {
				setSubmitStatus('error')
			}
		} catch (error) {
			setSubmitStatus('error')
		}
	}

	const renderStars = (rating) => {
		return Array.from({ length: 5 }, (_, i) => (
			<span key={i} style={{
				color: i < rating ? '#fbbf24' : '#e5e7eb',
				fontSize: '16px'
			}}>
				★
			</span>
		))
	}

	return (
		<section className="home">
			<div className="hero">
				{/* Cake Logo Image from src/images cake/cake logo.jpeg */}
				<img
	src={cakeLogo}
	alt="Cake House Logo"
	className="hero-cake-img"
	style={{
		width: '380px',         // You can increase this as needed
		height: 'auto',         // Keeps the aspect ratio correct
		marginBottom: '32px',   // Optional spacing
		display: 'block',
		margin: '0 auto'        // Center the image
	}}
/>
				<div className="hero-box">
					<span className="badge">Since 2024</span>
					<h1>Freshly Baked Happiness</h1>
					<p>Welcome to Shree Laadli Ji Cake House. Delicious cakes made with love.</p>
					<Link to="/products" className="btn">View Cakes</Link>
				</div>
			</div>

			{/* SUCCESS COUNTER */}
			<div className="success-counter" style={{
				background: 'linear-gradient(135deg, var(--red-primary) 0%, #dc2626 100%)',
				color: 'white',
				padding: '60px 20px',
				textAlign: 'center',
				margin: '40px 0'
			}}>
				<div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '10px' }}>
					{stats.completedOrders}+
				</div>
				<div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
					Orders Successfully Completed
				</div>
				<div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
					And counting... 🎂✨
				</div>
			</div>

			{/* REVIEWS SECTION */}
			<div className="reviews-section" style={{ padding: '60px 20px', background: '#fafafa' }}>
				<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
					<div style={{ textAlign: 'center', marginBottom: '40px' }}>
						<h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>What Our Customers Say</h2>
						<p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
							{stats.totalReviews} happy customers and counting!
						</p>
					</div>

					{/* Reviews Carousel */}
					{reviews.length > 0 && (
						<div style={{ marginBottom: '40px', position: 'relative' }}>
							<div style={{
								display: 'flex',
								overflow: 'hidden',
								width: '100%'
							}}>
								<div
									style={{
										display: 'flex',
										gap: '30px',
										transform: `translateX(-${currentSlide * 100}%)`,
										transition: 'transform 0.3s ease',
										width: `${(reviews.length / 3) * 100}%`,
										minWidth: '100%'
									}}
								>
									{reviews.map((review, index) => (
										<div
											key={review.id}
											className="card"
											style={{
												flex: '0 0 calc(33.333% - 20px)',
												padding: '30px',
												textAlign: 'center',
												background: 'white',
												borderRadius: '12px',
												boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
												minWidth: '300px'
											}}
										>
											<div style={{ marginBottom: '15px' }}>
												{renderStars(review.rating)}
											</div>
											<p style={{
												fontSize: '1.1rem',
												lineHeight: 1.6,
												marginBottom: '20px',
												fontStyle: 'italic'
											}}>
												"{review.comment}"
											</p>
											<div style={{
												fontWeight: '600',
												color: 'var(--red-primary)',
												fontSize: '1.1rem'
											}}>
												- {review.name}
											</div>
											<div style={{
												fontSize: '0.9rem',
												color: 'var(--text-muted)',
												marginTop: '5px'
											}}>
												{new Date(review.date).toLocaleDateString()}
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Navigation Buttons */}
							{reviews.length > 3 && (
								<>
									<button
										onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
										disabled={currentSlide === 0}
										style={{
											position: 'absolute',
											left: '-20px',
											top: '50%',
											transform: 'translateY(-50%)',
											background: 'var(--red-primary)',
											color: 'white',
											border: 'none',
											borderRadius: '50%',
											width: '40px',
											height: '40px',
											cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
											opacity: currentSlide === 0 ? 0.5 : 1,
											fontSize: '18px',
											fontWeight: 'bold',
											zIndex: 10
										}}
									>
										‹
									</button>
									<button
										onClick={() => setCurrentSlide(Math.min(Math.ceil(reviews.length / 3) - 1, currentSlide + 1))}
										disabled={currentSlide >= Math.ceil(reviews.length / 3) - 1}
										style={{
											position: 'absolute',
											right: '-20px',
											top: '50%',
											transform: 'translateY(-50%)',
											background: 'var(--red-primary)',
											color: 'white',
											border: 'none',
											borderRadius: '50%',
											width: '40px',
											height: '40px',
											cursor: currentSlide >= Math.ceil(reviews.length / 3) - 1 ? 'not-allowed' : 'pointer',
											opacity: currentSlide >= Math.ceil(reviews.length / 3) - 1 ? 0.5 : 1,
											fontSize: '18px',
											fontWeight: 'bold',
											zIndex: 10
										}}
									>
										›
									</button>
								</>
							)}

							{/* Dots Indicator */}
							{reviews.length > 3 && (
								<div style={{
									display: 'flex',
									justifyContent: 'center',
									gap: '8px',
									marginTop: '20px'
								}}>
									{Array.from({ length: Math.ceil(reviews.length / 3) }, (_, i) => (
										<button
											key={i}
											onClick={() => setCurrentSlide(i)}
											style={{
												width: '12px',
												height: '12px',
												borderRadius: '50%',
												border: 'none',
												background: currentSlide === i ? 'var(--red-primary)' : '#ddd',
												cursor: 'pointer'
											}}
										/>
									))}
								</div>
							)}
						</div>
					)}

					{/* Review Form Toggle */}
					<div style={{
						display: 'flex',
						justifyContent: 'center',
						gap: '15px',
						marginBottom: '30px',
						flexWrap: 'wrap'
					}}>
						<button
							onClick={() => setShowReviewForm(!showReviewForm)}
							className="btn"
							style={{
								background: 'var(--red-primary)',
								flexShrink: 0
							}}
						>
							{showReviewForm ? 'Cancel Review' : 'Write a Review'}
						</button>
						<Link to="/products" className="btn" style={{ flexShrink: 0 }}>
							View All Products
						</Link>
					</div>

					{/* Review Form */}
					{showReviewForm && (
						<div className="card" style={{
							maxWidth: '600px',
							margin: '0 auto',
							padding: '30px',
							background: 'white',
							borderRadius: '12px'
						}}>
							<h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
								Share Your Experience
							</h3>

							{submitStatus === 'success' && (
								<div style={{
									color: 'green',
									textAlign: 'center',
									marginBottom: '20px',
									padding: '10px',
									background: '#d1fae5',
									borderRadius: '8px'
								}}>
									Thank you for your review! ✨
								</div>
							)}

							{submitStatus === 'error' && (
								<div style={{
									color: 'red',
									textAlign: 'center',
									marginBottom: '20px',
									padding: '10px',
									background: '#fee2e2',
									borderRadius: '8px'
								}}>
									Failed to submit review. Please try again.
								</div>
							)}

							<form onSubmit={handleReviewSubmit}>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
									Your Name
								</label>
								<input
									type="text"
									value={reviewForm.name}
									onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
									required
									style={{
										width: '100%',
										padding: '12px',
										border: '1px solid #d1d5db',
										borderRadius: '8px',
										marginBottom: '20px',
										fontSize: '16px'
									}}
									placeholder="Enter your name"
								/>

								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
									Rating
								</label>
								<div style={{ marginBottom: '20px' }}>
									{[1, 2, 3, 4, 5].map(star => (
										<button
											key={star}
											type="button"
											onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
											style={{
												background: 'none',
												border: 'none',
												fontSize: '24px',
												color: star <= reviewForm.rating ? '#fbbf24' : '#e5e7eb',
												cursor: 'pointer',
												marginRight: '4px'
											}}
										>
											★
										</button>
									))}
									<span style={{ marginLeft: '10px', color: 'var(--text-muted)' }}>
										{reviewForm.rating} star{reviewForm.rating !== 1 ? 's' : ''}
									</span>
								</div>

								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
									Your Review
								</label>
								<textarea
									value={reviewForm.comment}
									onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
									required
									minLength={10}
									maxLength={500}
									rows={4}
									style={{
										width: '100%',
										padding: '12px',
										border: '1px solid #d1d5db',
										borderRadius: '8px',
										marginBottom: '20px',
										fontSize: '16px',
										resize: 'vertical'
									}}
									placeholder="Tell us about your experience with our cakes..."
								/>

								<button
									type="submit"
									className="btn"
									disabled={submitStatus === 'submitting'}
									style={{
										width: '100%',
										padding: '14px',
										background: submitStatus === 'submitting' ? '#9ca3af' : 'var(--red-primary)',
										fontSize: '16px'
									}}
								>
									{submitStatus === 'submitting' ? 'Submitting...' : 'Submit Review'}
								</button>
							</form>
						</div>
					)}
				</div>
			</div>
			<div className="intro">
				<h2>About Us</h2>
				<p style={{ lineHeight: 1.8, fontSize: '1.15rem', marginBottom: 0 }}>
					At <span style={{ color: 'var(--red-primary)', fontWeight: 600 }}>Shree Laadli Ji Cake House</span>, we don’t just bake cakes — <strong>we craft memories</strong>.<br />
					<span style={{ color: 'var(--text-muted)' }}>Since 2024</span>, we've been turning your sweetest moments into unforgettable experiences with our handcrafted cakes made from the finest ingredients.<br /><br />
					Whether it’s a <strong>birthday</strong>, <strong>wedding</strong>, <strong>anniversary</strong>, or a simple celebration of love, our custom-designed cakes — along with our delightful <span style={{ color: 'var(--red-primary)' }}>brownies, muffins, and cupcakes</span> — are made to match your emotions and your occasion.<br /><br />
					<span style={{ fontWeight: 600 }}>Taste the tradition, feel the joy, and let every slice bring a smile.</span>
				</p>
			</div>
		</section>
	)
}

