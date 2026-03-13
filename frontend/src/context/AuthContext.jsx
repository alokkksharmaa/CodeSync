import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auto-rehydrate session from localStorage on app load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('codesync_token')
      const storedUser = localStorage.getItem('codesync_user')

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (err) {
      // Corrupted data — clear it
      localStorage.removeItem('codesync_token')
      localStorage.removeItem('codesync_user')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Call this after a successful login or signup API response.
   * @param {{ token: string, user: object, roomId: string }} data
   */
  const login = (data) => {
    const { token: newToken, user: newUser, roomId } = data
    setToken(newToken)
    setUser({ ...newUser, roomId })
    localStorage.setItem('codesync_token', newToken)
    localStorage.setItem('codesync_user', JSON.stringify({ ...newUser, roomId }))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('codesync_token')
    localStorage.removeItem('codesync_user')
  }

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for consuming auth context
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
