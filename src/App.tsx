import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { useUser } from './hooks/useUser'

export default function App() {
  const { user, loading, logout, setUser } = useUser()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--accent-s)',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={user
          ? <DashboardPage user={user} logout={logout} setUser={setUser} />
          : <Navigate to="/" />
        }
      />
    </Routes>
  )
}
