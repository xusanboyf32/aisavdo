import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form)
      localStorage.setItem('token', data.access_token)
      const me = await api.get('/api/auth/me')
      localStorage.setItem('user', JSON.stringify(me.data))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '20%', left: '15%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: '20%', right: '15%',
        width: '250px', height: '250px',
        background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div className="glass-card fade-in-up" style={{
        width: '100%', maxWidth: '420px',
        padding: '48px 40px',
        boxShadow: '0 0 60px rgba(0,212,255,0.08), 0 8px 32px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px', height: '56px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #00d4ff, #a78bfa)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 0 30px rgba(0,212,255,0.4)',
            animation: 'pulse-glow 2s infinite'
          }}>⚡</div>
          <h1 style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '24px', fontWeight: 900,
            background: 'linear-gradient(135deg, #00d4ff, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '6px'
          }}>AiSavdo</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Hisobingizga kiring</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Username
            </label>
            <input
              className="input-glass"
              type="text"
              placeholder="username kiriting"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Parol
            </label>
            <input
              className="input-glass"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              color: '#fca5a5', fontSize: '13px'
            }}>⚠️ {error}</div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Kirish...' : 'Kirish →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#475569', fontSize: '14px' }}>
          Hisob yo'qmi?{' '}
          <Link to="/register" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 600 }}>
            Ro'yxatdan o'ting
          </Link>
        </p>
      </div>
    </div>
  )
}
