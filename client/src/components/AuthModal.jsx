import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './AuthModal.css'

export default function AuthModal({ onDismiss }) {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      if (isLogin) {
        const { error } = await signIn({ email, password })
        if (error) throw error
        if (onDismiss) onDismiss()
      } else {
        const { error } = await signUp({ email, password })
        if (error) throw error
        setSuccessMsg('Account created! You can now log in.')
        setIsLogin(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-logo">
          <span>LINE </span>
          <span className="logo-shark">SHARK</span>
        </div>
        
        <h2 className="auth-title">
          {isLogin ? 'Terminal Access' : 'Register Terminal'}
        </h2>
        
        <p className="auth-subtitle">
          {isLogin 
            ? 'Authenticate to access AI betting intelligence.' 
            : 'Create an account to access premium signals.'}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">EMAIL</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@lineshark.com"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary auth-submit interactive"
            disabled={loading}
          >
            {loading 
              ? 'AUTHENTICATING...' 
              : isLogin ? 'INITIALIZE SESSION' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="auth-toggle">
          <span className="text-secondary">
            {isLogin ? "Don't have access?" : "Already registered?"}
          </span>
          <button 
            className="btn-link interactive"
            onClick={() => {
              setIsLogin(!isLogin)
              setError(null)
              setSuccessMsg(null)
            }}
          >
            {isLogin ? 'Create Account' : 'Log In'}
          </button>
        </div>

        {onDismiss && (
          <button className="auth-close interactive" onClick={onDismiss}>
            ×
          </button>
        )}
      </div>
    </div>
  )
}
