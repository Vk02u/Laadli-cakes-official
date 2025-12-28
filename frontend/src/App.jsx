import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
	return (
		<div className="app-container">
			<Navbar />
			<main className="content">
				<Outlet />
			</main>
			<Footer />
		</div>
	)
}

