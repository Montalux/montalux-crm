import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  if (isAuthenticated) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const loginError = await login(email.trim(), password)
    if (!loginError) {
      localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false')
      if (!rememberMe) sessionStorage.setItem('currentSession', 'true')
      navigate('/', { replace: true })
    } else if (loginError === 'Invalid login credentials') {
      setError('E-Mail oder Passwort falsch.')
    } else {
      setError(`Anmeldung fehlgeschlagen: ${loginError}`)
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="card bg-base-100 shadow-md w-full max-w-sm">
        <div className="card-body">
          <h2 className="card-title text-2xl justify-center mb-4">Kunden-CRM</h2>
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="label-text">E-Mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
                autoComplete="username"
                required
                autoFocus
              />
            </label>
            <label className="block">
              <span className="label-text">Passwort</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full"
                autoComplete="current-password"
                required
              />
            </label>
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox checkbox-sm checkbox-primary"
              />
              <span className="label-text">Auf diesem Computer merken</span>
            </label>
            <button type="submit" className="btn btn-primary w-full">Anmelden</button>
          </form>
        </div>
      </div>
    </div>
  )
}
