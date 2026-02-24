import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Workspace = lazy(() => import('./pages/Workspace'))

const RouteLoader = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400); // 400ms visual loading feedback
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-[#0B0C10]/40 backdrop-blur-md flex items-center justify-center z-[9999] transition-opacity duration-300">
          <div className="flex flex-col items-center gap-4 bg-gray-900/80 p-6 rounded-2xl shadow-2xl border border-gray-700/50">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-blue-400 tracking-widest uppercase animate-pulse">Loading</p>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

const App = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#0B0C10] flex items-center justify-center z-50"><div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /></div>}>
      <RouteLoader>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/:id"
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />

          {/* Default + catch-all */}
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </RouteLoader>
    </Suspense>
  )
}

export default App
