import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (login(password)) {
      navigate('/admin')
    } else {
      setError('Invalid password')
    }
  }

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px 30px',
        textAlign: 'center'
      }}>
        <h2>Admin Login</h2>
        <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
          <label style={{
            display: 'block',
            textAlign: 'left',
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid var(--gray-medium)',
              borderRadius: '8px',
              fontSize: '16px',
              marginBottom: '16px'
            }}
            required
          />

          {error && (
            <div style={{
              color: '#ef4444',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px'
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
