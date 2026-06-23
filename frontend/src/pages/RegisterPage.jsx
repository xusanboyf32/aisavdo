import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', password: '',
    first_name: '', last_name: '', phone: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/register', form)
      const { data } = await api.post('/api/auth/login', {
        username: form.username,
        password: form.password
      })
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

  const fields = [
    { key: 'first_name', label: 'Ism', placeholder: 'Ismingiz', type: 'text' },
    { key: 'last_name', label: 'Familiya', placeholder: 'Familiyangiz', type: 'text' },
    { key: 'phone', label: 'Telefon', placeholder: '+998901234567', type: 'tel' },
    { key: 'username', label: 'Username', placeholder: 'username', type: 'text' },
    { key: 'password', label: 'Parol', placeholder: '••••••••', type: 'password' },
  ]

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{
        position: 'fixed', top: '10%', right: '10%',
        width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div className="glass-card fade-in-up" style={{
        width: '100%', maxWidth: '440px',
        padding: '48px 40px',
        boxShadow: '0 0 60px rgba(167,139,250,0.08), 0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px', height: '56px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #a78bfa, #00d4ff)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 0 30px rgba(167,139,250,0.4)',
          }}>✨</div>
          <h1 style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '22px', fontWeight: 900,
            background: 'linear-gradient(135deg, #a78bfa, #00d4ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '6px'
          }}>Ro'yxatdan o'tish</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Yangi hisob yarating</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {fields.map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {label}
              </label>
              <input
                className="input-glass"
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                required
              />
            </div>
          ))}

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
            {loading ? 'Yaratilmoqda...' : "Ro'yxatdan o'tish →"}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#475569', fontSize: '14px' }}>
          Hisobingiz bormi?{' '}
          <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
            Kirish
          </Link>
        </p>
      </div>
    </div>
  )
}
