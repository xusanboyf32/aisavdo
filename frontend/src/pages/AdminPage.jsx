import { useState, useEffect } from 'react'
import api from '../api/axios'

// ─── ADMIN LOGIN ────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form)
      const me = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      })
      if (!me.data.is_admin) {
        setError("Sizda admin huquqi yo'q!")
        return
      }
      onLogin(data.access_token, me.data)
    } catch {
      setError("Username yoki parol noto'g'ri")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: '400px', padding: '48px 40px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '20px', boxShadow: '0 0 60px rgba(245,158,11,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px', height: '56px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', boxShadow: '0 0 30px rgba(245,158,11,0.4)',
          }}>⚙️</div>
          <h1 style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: '22px', fontWeight: 900,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px',
          }}>Admin Panel</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Faqat adminlar uchun</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { key: 'username', label: 'Username', type: 'text', placeholder: 'admin username' },
            { key: 'password', label: 'Parol', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                required
                style={{
                  width: '100%', padding: '13px 16px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: '#f1f5f9', fontSize: '14px', outline: 'none',
                }}
              />
            </div>
          ))}

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '14px', marginTop: '8px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            border: 'none', borderRadius: '10px', color: '#000',
            fontSize: '15px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>{loading ? 'Kirish...' : 'Kirish →'}</button>
        </form>
      </div>
    </div>
  )
}

// ─── CONSTANTS ──────────────────────────────────────
const BRANDS = ['Samsung', 'Apple', 'Xiaomi', 'Realme', 'Huawei', 'Oppo', 'Vivo', 'OnePlus']
const emptyProduct = { name: '', brand: 'Samsung', price: '', ram: '', storage: '', color: '', description: '', stock: '' }

// ─── MAIN ADMIN PANEL ───────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'))
  const [admin, setAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
 })
  const [tab, setTab] = useState('products')

  // Products
  const [products, setProducts] = useState([])
  const [productLoading, setProductLoading] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Users
  const [users, setUsers] = useState([])
  const [userLoading, setUserLoading] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState({ username: '', password: '', first_name: '', last_name: '', phone: '', is_admin: false })
  const [userSaving, setUserSaving] = useState(false)
  const [deleteUserConfirm, setDeleteUserConfirm] = useState(null)

  // Orders
  const [orders, setOrders] = useState([])
  const [orderLoading, setOrderLoading] = useState(false)

  // Settings
  const [settings, setSettings] = useState({ telegram_chat_id: '' })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } }
  const handleLogin = (t, u) => {
    localStorage.setItem('admin_token', t)
    localStorage.setItem('admin_user', JSON.stringify(u))
    setToken(t)
    setAdmin(u)
 }
  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setToken(null)
    setAdmin(null)
 }
 const [stats, setStats] = useState(null)


  useEffect(() => { if (token && tab === 'products') fetchProducts() }, [token, tab])
  useEffect(() => { if (token && tab === 'users') fetchUsers() }, [token, tab])
  useEffect(() => { if (token && tab === 'orders') fetchOrders() }, [token, tab])
  useEffect(() => { if (token && tab === 'settings') fetchSettings() }, [token, tab])

  // ─── Products ─────────────────────────────────────
  const fetchProducts = async () => {
    setProductLoading(true)
    try {
      const { data } = await api.get('/api/products/', authHeaders)
      setProducts(data)
    } finally { setProductLoading(false) }
  }

  const openCreateProduct = () => {
    setEditProduct(null)
    setProductForm(emptyProduct)
    setImage(null); setImagePreview(null)
    setShowProductForm(true)
  }

  const openEditProduct = (p) => {
    setEditProduct(p)
    setProductForm({
      name: p.name, brand: p.brand, price: p.price,
      ram: p.ram || '', storage: p.storage || '',
      color: p.color || '', description: p.description || '', stock: p.stock,
    })
    setImage(null)
    setImagePreview(p.image_data || p.image_url || null)
    setShowProductForm(true)
  }

  const handleSaveProduct = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(productForm).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      if (image) fd.append('image', image)
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      if (editProduct) {
        await api.put(`/api/products/${editProduct.id}`, fd, { headers })
      } else {
        await api.post('/api/products/', fd, { headers })
      }
      setShowProductForm(false)
      fetchProducts()
    } catch (err) {
      alert(err.response?.data?.detail || 'Xatolik')
    } finally { setSaving(false) }
  }

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/api/products/${id}`, authHeaders)
      setDeleteConfirm(null)
      fetchProducts()
    } catch (err) { alert(err.response?.data?.detail || 'Xatolik') }
  }

  // ─── Users ────────────────────────────────────────
  const fetchUsers = async () => {
    setUserLoading(true)
    try {
      const { data } = await api.get('/api/auth/users', authHeaders)
      setUsers(data)
    } finally { setUserLoading(false) }
  }

  const handleCreateUser = async () => {
    setUserSaving(true)
    try {
      const endpoint = userForm.is_admin ? '/api/auth/create-admin' : '/api/auth/register'
      await api.post(endpoint, { ...userForm })
      setShowUserForm(false)
      setUserForm({ username: '', password: '', first_name: '', last_name: '', phone: '', is_admin: false })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Xatolik')
    } finally { setUserSaving(false) }
  }

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/api/auth/users/${id}`, authHeaders)
      setDeleteUserConfirm(null)
      fetchUsers()
    } catch (err) { alert(err.response?.data?.detail || 'Xatolik') }
  }

  // ─── Orders ───────────────────────────────────────
  const fetchOrders = async () => {
  setOrderLoading(true)
  try {
    const [ordersRes, statsRes] = await Promise.all([
      api.get('/api/orders/all', authHeaders),
      api.get('/api/orders/stats', authHeaders),
    ])
    setOrders(ordersRes.data)
    setStats(statsRes.data)
  } catch {
    setOrders([])
  } finally {
    setOrderLoading(false)
  }
}

  // ─── Settings ─────────────────────────────────────
  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/api/settings/', authHeaders)
      setSettings({ telegram_chat_id: data.telegram_chat_id || '' })
    } catch {}
  }

  const handleSaveSettings = async () => {
    setSettingsSaving(true)
    try {
      await api.put('/api/settings/', settings, authHeaders)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    } catch (err) {
      alert(err.response?.data?.detail || 'Xatolik')
    } finally { setSettingsSaving(false) }
  }

  if (!token) return <AdminLogin onLogin={handleLogin} />

  const TABS = [
    { key: 'products', label: '📱 Mahsulotlar' },
    { key: 'users', label: '👥 Foydalanuvchilar' },
    { key: 'orders', label: '🛒 Buyurtmalar' },
    { key: 'settings', label: '⚙️ Sozlamalar' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f1f5f9' }}>

      {/* Navbar */}
      <nav style={{
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(3,7,18,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', boxShadow: '0 0 15px rgba(245,158,11,0.4)',
          }}>⚙️</div>
          <span style={{
            fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '18px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Admin Panel</span>
          <span style={{ color: '#475569', fontSize: '13px' }}>— {admin?.username}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => window.open('/', '_blank')} style={{
            padding: '8px 16px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
            color: '#94a3b8', fontSize: '13px', cursor: 'pointer',
          }}>← Sayt</button>
          <button onClick={handleLogout} style={{
            padding: '8px 16px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px',
            color: '#f87171', fontSize: '13px', cursor: 'pointer',
          }}>Chiqish</button>
        </div>
      </nav>

      <div style={{ padding: '32px', maxWidth: '1300px', margin: '0 auto' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Mahsulotlar', value: products.length, icon: '📱', color: '#00d4ff' },
            { label: 'Foydalanuvchilar', value: users.length, icon: '👥', color: '#a78bfa' },
            { label: 'Buyurtmalar', value: orders.length, icon: '🛒', color: '#34d399' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '20px 24px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <div style={{ fontSize: '32px' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '13px', color: '#475569' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 20px',
              background: tab === t.key ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${tab === t.key ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '10px', color: tab === t.key ? '#000' : '#94a3b8',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ─── PRODUCTS TAB ─── */}
        {tab === 'products' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Mahsulotlar — {products.length} ta</h2>
              <button onClick={openCreateProduct} style={{
                padding: '10px 24px', background: 'linear-gradient(135deg, #00d4ff, #a78bfa)',
                border: 'none', borderRadius: '10px', color: '#000',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0,212,255,0.3)',
              }}>+ Mahsulot qo'shish</button>
            </div>
            {productLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>Yuklanmoqda...</div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px', color: '#475569' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📱</div>
                <div>Mahsulot yo'q — qo'shish tugmasini bosing</div>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Rasm', 'Nomi', 'Narxi', 'RAM', 'Xotira', 'Rang', 'Ombor', 'Amallar'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          {p.image_data || p.image_url ? (
                            <img src={p.image_data || p.image_url} alt={p.name} style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }} />
                          ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📱</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.brand} {p.name}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {new Intl.NumberFormat('uz-UZ').format(p.price)} so'm
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>{p.ram || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>{p.storage || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>{p.color || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                            background: p.stock > 5 ? 'rgba(52,211,153,0.15)' : p.stock > 0 ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)',
                            color: p.stock > 5 ? '#34d399' : p.stock > 0 ? '#fbbf24' : '#f87171',
                            border: `1px solid ${p.stock > 5 ? 'rgba(52,211,153,0.3)' : p.stock > 0 ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          }}>{p.stock} ta</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEditProduct(p)} style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '7px', color: '#00d4ff', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => setDeleteConfirm(p)} style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '7px', color: '#f87171', cursor: 'pointer' }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ─── USERS TAB ─── */}
        {tab === 'users' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Foydalanuvchilar — {users.length} ta</h2>
              <button onClick={() => setShowUserForm(true)} style={{
                padding: '10px 24px', background: 'linear-gradient(135deg, #a78bfa, #00d4ff)',
                border: 'none', borderRadius: '10px', color: '#000',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              }}>+ User qo'shish</button>
            </div>
            {userLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>Yuklanmoqda...</div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px', color: '#475569' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
                <div>Foydalanuvchi yo'q</div>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['#', 'Ism', 'Username', 'Telefon', 'Rol', 'Sana', 'Amallar'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>{u.id}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '10px',
                              background: u.is_admin ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #00d4ff, #a78bfa)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '14px', fontWeight: 700, color: '#000',
                            }}>{u.first_name?.[0]?.toUpperCase()}</div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{u.first_name} {u.last_name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>@{u.username}</td>
                        <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{u.phone}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                            background: u.is_admin ? 'rgba(245,158,11,0.15)' : 'rgba(99,179,237,0.15)',
                            color: u.is_admin ? '#f59e0b' : '#63b3ed',
                            border: `1px solid ${u.is_admin ? 'rgba(245,158,11,0.3)' : 'rgba(99,179,237,0.3)'}`,
                          }}>{u.is_admin ? '⚙️ Admin' : '👤 User'}</span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px' }}>
                          {new Date(u.created_at).toLocaleDateString('uz-UZ')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => setDeleteUserConfirm(u)}
                            disabled={u.id === admin?.id}
                            style={{
                              padding: '6px 12px', fontSize: '12px',
                              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: '7px', color: '#f87171',
                              cursor: u.id === admin?.id ? 'not-allowed' : 'pointer',
                              opacity: u.id === admin?.id ? 0.4 : 1,
                            }}
                          >🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ─── ORDERS TAB ─── */}
        {tab === 'orders' && (
  <>
    <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>🛒 Buyurtmalar</h2>

    {/* Statistika kartochkalari */}
    {stats && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Bugungi savdo', value: new Intl.NumberFormat('uz-UZ').format(stats.daily_revenue) + " so'm", sub: `${stats.daily_orders} ta buyurtma`, color: '#00d4ff', icon: '📅' },
          { label: 'Oylik savdo', value: new Intl.NumberFormat('uz-UZ').format(stats.monthly_revenue) + " so'm", sub: `${stats.monthly_orders} ta buyurtma`, color: '#a78bfa', icon: '📆' },
          { label: 'Jami savdo', value: new Intl.NumberFormat('uz-UZ').format(stats.total_revenue) + " so'm", sub: `${stats.total_orders} ta buyurtma`, color: '#34d399', icon: '💰' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '20px', background: 'rgba(255,255,255,0.04)',
            border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '14px',
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{s.sub}</div>
          </div>
        ))}
      </div>
    )}

    {/* Buyurtmalar jadvali */}
    {orderLoading ? (
      <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>Yuklanmoqda...</div>
    ) : orders.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '80px', color: '#475569' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
        <div>Hozircha buyurtma yo'q</div>
      </div>
    ) : (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['#', 'Mijoz', 'Telefon', 'Mahsulot', 'Summa', 'Status', 'Sana'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>#{o.id}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600 }}>{o.client_first_name} {o.client_last_name}</td>
                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{o.client_phone}</td>
                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{o.product_name || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {new Intl.NumberFormat('uz-UZ').format(o.total_price)} so'm
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: o.status === 'pending' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                    color: o.status === 'pending' ? '#fbbf24' : '#34d399',
                    border: `1px solid ${o.status === 'pending' ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)'}`,
                  }}>{o.status === 'pending' ? '⏳ Kutilmoqda' : '✅ Bajarildi'}</span>
                </td>
                <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px' }}>
                  {new Date(o.created_at).toLocaleDateString('uz-UZ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </>
)}

        {/* ─── SETTINGS TAB ─── */}
        {tab === 'settings' && (
          <div style={{ maxWidth: '500px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>⚙️ Sozlamalar</h2>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '28px',
              display: 'flex', flexDirection: 'column', gap: '20px',
            }}>
              <div style={{
                padding: '16px', background: 'rgba(0,212,255,0.05)',
                border: '1px solid rgba(0,212,255,0.15)', borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{ fontSize: '28px' }}>📬</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '2px' }}>Telegram Chat ID</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Buyurtmalar shu chat ga yuboriladi</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Chat ID
                </label>
                <input
                    className="input-glass"
                    type="password"
                    placeholder="-100xxxxxxxxxx yoki @username"
                    value={settings.telegram_chat_id}
                    onChange={e => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                    />
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                  💡 Chat ID olish: @userinfobot ga /start yuboring
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                style={{
                  padding: '13px',
                  background: settingsSaved
                    ? 'linear-gradient(135deg, #34d399, #059669)'
                    : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  border: 'none', borderRadius: '10px',
                  color: '#000', fontSize: '14px', fontWeight: 700,
                  cursor: settingsSaving ? 'not-allowed' : 'pointer',
                  opacity: settingsSaving ? 0.7 : 1, transition: 'all 0.3s',
                }}
              >
                {settingsSaved ? '✅ Saqlandi!' : settingsSaving ? 'Saqlanmoqda...' : '💾 Saqlash'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && setShowProductForm(false)}
        >
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '540px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '28px', background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {editProduct ? '✏️ Tahrirlash' : '+ Yangi mahsulot'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rasm</label>
                <div style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => document.getElementById('prodImg').click()}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" style={{ maxHeight: '130px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                  ) : (
                    <div>
                      <div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div>
                      <div style={{ fontSize: '13px', color: '#475569' }}>Rasm yuklash uchun bosing</div>
                    </div>
                  )}
                </div>
                <input id="prodImg" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                  const f = e.target.files[0]; if (!f) return
                  setImage(f)
                  const r = new FileReader(); r.onload = ev => setImagePreview(ev.target.result); r.readAsDataURL(f)
                }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brend</label>
                <select value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9', fontSize: '14px', outline: 'none' }}>
                  {BRANDS.map(b => <option key={b} value={b} style={{ background: '#0f172a' }}>{b}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Model nomi</label>
                <input className="input-glass" placeholder="Galaxy A55" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Narxi (so'm)</label>
                  <input className="input-glass" type="number" placeholder="4990000" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Omborda (ta)</label>
                  <input className="input-glass" type="number" placeholder="10" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RAM</label>
                  <input className="input-glass" placeholder="8GB" value={productForm.ram} onChange={e => setProductForm({ ...productForm, ram: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Xotira</label>
                  <input className="input-glass" placeholder="256GB" value={productForm.storage} onChange={e => setProductForm({ ...productForm, storage: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rang</label>
                <input className="input-glass" placeholder="Qora, Oq..." value={productForm.color} onChange={e => setProductForm({ ...productForm, color: e.target.value })} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tavsif</label>
                <textarea className="input-glass" placeholder="Mahsulot haqida..." value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} rows={3} style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowProductForm(false)} style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}>Bekor</button>
                <button onClick={handleSaveProduct} disabled={saving} style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', border: 'none', borderRadius: '10px', color: '#000', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saqlanmoqda...' : editProduct ? '✅ Saqlash' : "+ Qo'shish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => e.target === e.currentTarget && setShowUserForm(false)}
        >
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '28px', background: 'linear-gradient(135deg, #a78bfa, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              + Yangi foydalanuvchi
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'first_name', label: 'Ism', placeholder: 'Jasur' },
                { key: 'last_name', label: 'Familiya', placeholder: 'Toshmatov' },
                { key: 'phone', label: 'Telefon', placeholder: '+998901234567' },
                { key: 'username', label: 'Username', placeholder: 'jasur01' },
                { key: 'password', label: 'Parol', placeholder: '••••••••', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
                  <input className="input-glass" type={f.type || 'text'} placeholder={f.placeholder} value={userForm[f.key]} onChange={e => setUserForm({ ...userForm, [f.key]: e.target.value })} />
                </div>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', cursor: 'pointer' }}
                onClick={() => setUserForm({ ...userForm, is_admin: !userForm.is_admin })}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '5px',
                  background: userForm.is_admin ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${userForm.is_admin ? 'transparent' : 'rgba(255,255,255,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                }}>{userForm.is_admin ? '✓' : ''}</div>
                <span style={{ fontSize: '14px', color: userForm.is_admin ? '#f59e0b' : '#94a3b8', fontWeight: 500 }}>Admin huquqi berish</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowUserForm(false)} style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}>Bekor</button>
                <button onClick={handleCreateUser} disabled={userSaving} style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg, #a78bfa, #00d4ff)', border: 'none', borderRadius: '10px', color: '#000', fontSize: '14px', fontWeight: 700, cursor: userSaving ? 'not-allowed' : 'pointer', opacity: userSaving ? 0.7 : 1 }}>
                  {userSaving ? 'Yaratilmoqda...' : "+ Yaratish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '32px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '14px' }}>🗑️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>O'chirishni tasdiqlang</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              <strong style={{ color: '#f1f5f9' }}>{deleteConfirm.brand} {deleteConfirm.name}</strong> o'chirilsinmi?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}>Bekor</button>
              <button onClick={() => handleDeleteProduct(deleteConfirm.id)} style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', color: '#f87171', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>O'chirish</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirm */}
      {deleteUserConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '32px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '14px' }}>👤</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Foydalanuvchini o'chirish</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              <strong style={{ color: '#f1f5f9' }}>@{deleteUserConfirm.username}</strong> o'chirilsinmi?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteUserConfirm(null)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}>Bekor</button>
              <button onClick={() => handleDeleteUser(deleteUserConfirm.id)} style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', color: '#f87171', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

