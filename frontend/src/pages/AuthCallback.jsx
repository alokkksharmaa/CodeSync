import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AuthCallback = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token)
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-[#0B0C10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-blue-400 text-sm tracking-widest uppercase animate-pulse">Signing you in...</p>
      </div>
    </div>
  )
}

export default AuthCallback