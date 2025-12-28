import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './AuthContext.jsx'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Products from './pages/Products.jsx'
import Order from './pages/Order.jsx'
import Contact from './pages/Contact.jsx'
import Admin from './pages/Admin.jsx'
import Analytics from './pages/Analytics.jsx'
import Login from './pages/Login.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import './styles.css'

const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
		children: [
			{ index: true, element: <Home /> },
			{ path: 'products', element: <Products /> },
			{ path: 'order', element: <Order /> },
			{ path: 'contact', element: <Contact /> },
      { path: 'login', element: <Login /> },
      { path: 'admin', element: <ProtectedRoute><Admin /></ProtectedRoute> },
      { path: 'analytics', element: <ProtectedRoute><Analytics /></ProtectedRoute> },
		],
	},
])

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<AuthProvider>
			<RouterProvider router={router} />
		</AuthProvider>
	</React.StrictMode>
)

