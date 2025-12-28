import { FaInstagram } from 'react-icons/fa'

export default function Footer() {
	return (
		<footer className="footer" style={{ background: '#000', color: '#fff' }}>
			<div
				className="footer-inner"
				style={{
					maxWidth: 1200,
					margin: '0 auto',
					padding: '24px 16px',
				}}
			>
				<div
					className="footer-grid"
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 16,
						textAlign: 'center'
					}}
				>
					{/* Brand */}
					<div style={{ fontWeight: 600, fontSize: '1.2rem' }}>
						Shree Laadli Ji Cake House
					</div>

					{/* Instagram */}
					<a
						href="https://www.instagram.com/shree_laadli_ji_cake_house?igsh=cnVod2dtMHVkNGRn"
						target="_blank"
						rel="noreferrer"
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							padding: '8px 14px',
							borderRadius: 30,
							background: 'linear-gradient(45deg, #f58529, #dd2a7b, #8134af)',
							color: '#fff',
							textDecoration: 'none',
							fontWeight: 500,
							transition: 'transform 0.2s ease'
						}}
						onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
						onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
					>
						<FaInstagram size={18} />
						<span>Follow us on Instagram</span>
					</a>

					{/* Copyright */}
					<div style={{ fontSize: '1.2rem', opacity: 0.85 }}>
						© 2024 Shree Laadli Ji Cake House. All rights reserved.
					</div>
				</div>
			</div>
		</footer>
	)
}
