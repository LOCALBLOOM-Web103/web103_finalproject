import { createContext, useContext, useEffect, useState } from 'react'
import Loading from './components/Loading.jsx'

const AuthContext = createContext(null)

// Login is a server route (Passport), so it needs a full page load, not a router <Link>
export const LOGIN_URL = '/auth/github'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function logout() {
    await fetch('/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

// Wrap a route element: logged-out visitors are sent to GitHub login.
// ponytail: after login the server redirects to "/", not back here. Passport resets the
// session on login, so a return path would have to travel in the OAuth `state` param.
export function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) window.location.assign(LOGIN_URL)
  }, [loading, user])

  if (loading) return <Loading label="Checking login…" />
  if (!user) return <Loading label="Redirecting to GitHub login…" />
  return children
}
