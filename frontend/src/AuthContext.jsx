import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on app load
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      // Simple token validation - you can make this more secure
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const login = (password) => {
    // Simple password check - replace with proper authentication
    if (password === '') { // Change this to a secure password
      localStorage.setItem('adminToken', 'authenticated')
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
  }

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
