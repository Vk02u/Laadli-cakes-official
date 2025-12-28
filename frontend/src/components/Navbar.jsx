import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Navbar() {
	const [open, setOpen] = useState(false)
	const { isAuthenticated } = useAuth()

	function closeMenu() {
		setOpen(false)
	}

	return (
		<header className="navbar">
			<div className="nav-inner">
				<Link to="/" className="brand">
					<span className="logo-dot" />
					Shree Laadli Ji Cake House
				</Link>
				<button
					className="menu-toggle"
					aria-label="Toggle navigation menu"
					aria-controls="primary-navigation"
					aria-expanded={open}
					onClick={() => setOpen(v => !v)}
				>
					<span />
					<span />
					<span />
				</button>
				<nav id="primary-navigation" className={`nav-links ${open ? 'open' : ''}`}>
					<NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Home</NavLink>
					<NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Products</NavLink>
					<NavLink to="/order" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Order</NavLink>
					<NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Contact</NavLink>
					{isAuthenticated && (
						<>
							<NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Admin</NavLink>
							<NavLink to="/analytics" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Analytics</NavLink>
						</>
					)}
				</nav>
			</div>
		</header>
	)
}

