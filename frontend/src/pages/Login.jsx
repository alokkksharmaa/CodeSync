import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const ROTATING_WORDS = ['build', 'share', 'manage', 'code', 'design']

const AnimatedWord = () => {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(prev => (prev + 1) % ROTATING_WORDS.length)
        setVisible(true)
      }, 400)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className={`auth-hero-word ${visible ? 'word-visible' : 'word-hidden'}`}>
      {ROTATING_WORDS[index]}
    </span>
  )
}

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const emailRef = useRef(null)

  useEffect(() => { emailRef.current?.focus() }, [])

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Email and password are required.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { email: form.email, password: form.password })
      login(res.data)
      toast.success(`Welcome back, ${res.data.user.username}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-split">
      {/* ─── Left: Hero Panel ─── */}
      <div className="auth-hero">
        <div className="auth-hero-grid" />
        <div className="auth-hero-glow" />
        <div className="auth-hero-content">
          <div className="auth-hero-logo">
            <span>⚡🧑🏻‍💻</span>
            <span>CodeSync</span>
          </div>
          <h1 className="auth-hero-headline">
            A platform where
            <br />
            you can <AnimatedWord />
          </h1>
          <p className="auth-hero-sub">
            Real-time collaboration for developers who ship fast.
          </p>
        </div>
      </div>

      {/* ─── Right: Form ─── */}
      <div className="auth-form-panel flex-1 flex items-center justify-center p-8 bg-[#0B0C10] relative z-10 w-full lg:w-1/2 border-l border-gray-800">
        <div className="auth-card">
          <div className="auth-header mb-8 text-center max-w-sm mx-auto">
            <div className="auth-mobile-brand flex items-center justify-center gap-2 mb-6 md:hidden">
              <span className="text-yellow-400 text-xl">⚡🧑🏻‍💻</span>
              <span className="text-xl font-bold tracking-tight text-white font-display">CodeSync</span>
            </div>
            <h1 className="auth-title text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2 font-display">Welcome back</h1>
            <p className="auth-subtitle text-lg text-gray-400">Sign in to your workspace</p>
          </div>

          <form className="auth-form flex flex-col gap-5 max-w-sm mx-auto w-full" onSubmit={handleSubmit} noValidate>
            <div className="form-group flex flex-col gap-1.5">
              <label htmlFor="email" className="form-label text-sm font-medium text-gray-300">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                ref={emailRef}
                className="form-input h-12 w-full px-4 rounded-lg bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-blue-500/40 transition-all backdrop-blur-sm"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label htmlFor="password" className="form-label text-sm font-medium text-gray-300">Password</label>
              <div className="password-input-wrapper relative flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input h-12 w-full px-4 rounded-lg bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-blue-500/40 transition-all backdrop-blur-sm pr-12"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle absolute right-3 text-gray-400 hover:text-gray-200 p-1 rounded-md hover:bg-white/5 transition"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full h-12 mt-2 rounded-lg text-lg font-medium transition-all hover:-translate-y-0.5 flex items-center justify-center ${loading ? 'opacity-80 pointer-events-none' : ''}`}
              disabled={loading}
            >
              {loading ? <span className="btn-spinner w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer mt-8 text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="auth-link text-blue-400 hover:text-blue-300 font-medium transition">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
