import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = () => {
    setLoggingOut(true)
    setTimeout(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
    }, 500)
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(3, 7, 18, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <div style={{
          width: '32px', height: '32px',
          background: 'linear-gradient(135deg, #00d4ff, #a78bfa)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', boxShadow: '0 0 15px rgba(0,212,255,0.4)'
        }}>⚡</div>
        <span style={{
          fontFamily: 'Orbitron, sans-serif',
          fontWeight: 900, fontSize: '18px',
          background: 'linear-gradient(135deg, #00d4ff, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '1px'
        }}>AiSavdo</span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { label: '📱 Mahsulotlar', path: '/' },
          { label: '🤖 AI Chat', path: '/ai' },
        ].map(({ label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              padding: '8px 16px',
              background: location.pathname === path
                ? 'rgba(0,212,255,0.15)'
                : 'transparent',
              border: `1px solid ${location.pathname === path ? 'rgba(0,212,255,0.4)' : 'transparent'}`,
              borderRadius: '8px',
              color: location.pathname === path ? '#00d4ff' : '#94a3b8',
              fontSize: '13px', fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (location.pathname !== path) {
                e.target.style.color = '#f1f5f9'
                e.target.style.background = 'rgba(255,255,255,0.05)'
              }
            }}
            onMouseLeave={e => {
              if (location.pathname !== path) {
                e.target.style.color = '#94a3b8'
                e.target.style.background = 'transparent'
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, #00d4ff, #a78bfa)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: '#000'
          }}>
            {user.first_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 500 }}>
            {user.first_name} {user.last_name}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="btn-neon"
          style={{ padding: '7px 16px', fontSize: '13px', opacity: loggingOut ? 0.5 : 1 }}
        >
          Chiqish
        </button>
      </div>
    </nav>
  )
}
