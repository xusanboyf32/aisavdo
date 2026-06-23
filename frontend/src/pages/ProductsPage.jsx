import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'

export default function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('Barchasi')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [orderModal, setOrderModal] = useState(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [ordering, setOrdering] = useState(false)

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/api/products/')
      setProducts(data)
      setFiltered(data)
      localStorage.setItem('products_cache', JSON.stringify(data))
      localStorage.setItem('products_cache_time', Date.now().toString())
    } catch {
      const cached = localStorage.getItem('products_cache')
      if (cached) {
        const data = JSON.parse(cached)
        setProducts(data)
        setFiltered(data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const cached = localStorage.getItem('products_cache')
    const cacheTime = localStorage.getItem('products_cache_time')
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 30000) {
      const data = JSON.parse(cached)
      setProducts(data)
      setFiltered(data)
      setLoading(false)
    } else {
      fetchProducts()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchProducts()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    let result = products
    if (selectedBrand !== 'Barchasi') result = result.filter(p => p.brand === selectedBrand)
    if (search) result = result.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
  }, [search, selectedBrand, products])

  useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const productId = params.get('product_id')
  if (productId && products.length > 0) {
    const found = products.find(p => p.id === parseInt(productId))
    if (found) setSelectedProduct(found)
  }
}, [products])



  const brands = ['Barchasi', ...new Set(products.map(p => p.brand))]
  const formatPrice = (p) => new Intl.NumberFormat('uz-UZ').format(p) + " so'm"
  const imageSrc = selectedProduct ? (selectedProduct.image_data || selectedProduct.image_url) : null

  const confirmOrder = async () => {
    setOrdering(true)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      await api.post('/api/orders/', {
        product_id: orderModal.id,
        client_first_name: user.first_name,
        client_last_name: user.last_name,
        client_phone: user.phone,
      })
      setOrderModal(null)
      setOrderSuccess(true)
      setTimeout(() => setOrderSuccess(false), 4000)
      fetchProducts()
    } catch (err) {
      alert(err.response?.data?.detail || 'Xatolik')
    } finally {
      setOrdering(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px', maxWidth: '1400px', margin: '0 auto' }}>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '24px', fontWeight: 900, marginBottom: '6px', background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📱 Telefonlar</h1>
        <p style={{ color: '#475569', fontSize: '14px' }}>{products.length} ta mahsulot mavjud</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input className="input-glass" placeholder="🔍 Telefon qidiring..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '280px' }} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {brands.map(brand => (
            <button key={brand} onClick={() => setSelectedBrand(brand)} style={{
              padding: '9px 16px',
              background: selectedBrand === brand ? 'linear-gradient(135deg, #00d4ff, #a78bfa)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${selectedBrand === brand ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '10px', color: selectedBrand === brand ? '#000' : '#94a3b8',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}>{brand}</button>
          ))}
        </div>
      </div>

      <div className="glass-card" onClick={() => navigate('/ai')} style={{
        padding: '16px 20px', marginBottom: '24px', cursor: 'pointer',
        background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(167,139,250,0.06))',
        border: '1px solid rgba(0,212,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 0 16px rgba(0,212,255,0.3)', animation: 'float 3s ease-in-out infinite' }}>🤖</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginBottom: '2px' }}>AI Savdo Konsultanti</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Byudjetingizga mos telefon tanlashda yordam beradi</div>
          </div>
        </div>
        <div style={{ color: '#00d4ff', fontSize: '18px' }}>→</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#475569' }}>
          <div style={{ fontSize: '28px', marginBottom: '12px', animation: 'float 1.5s ease-in-out infinite' }}>⚡</div>
          <div>Yuklanmoqda...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#475569' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <div>Mahsulot topilmadi</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {filtered.map((product, i) => (
            <div key={product.id} className="fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <ProductCard product={product} onClick={() => setSelectedProduct(product)} onOrder={() => setOrderModal(product)} />
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => e.target === e.currentTarget && setSelectedProduct(null)}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '760px', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 0 80px rgba(0,212,255,0.1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(167,139,250,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', minHeight: '340px', borderRight: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(0,212,255,0.08) 0%, transparent 70%)' }} />
                {imageSrc ? (
                  <img src={imageSrc} alt={selectedProduct.name} style={{ maxHeight: '280px', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 30px rgba(0,212,255,0.25))', animation: 'float 4s ease-in-out infinite' }} />
                ) : (
                  <div style={{ fontSize: '100px', opacity: 0.15 }}>📱</div>
                )}
              </div>

              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button onClick={() => setSelectedProduct(null)} style={{ alignSelf: 'flex-end', width: '32px', height: '32px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>✕</button>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#00d4ff', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>{selectedProduct.brand}</div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>{selectedProduct.name}</h2>
                </div>

                <div style={{ fontSize: '26px', fontWeight: 900, background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {formatPrice(selectedProduct.price)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { icon: '💾', label: 'RAM', value: selectedProduct.ram },
                    { icon: '📀', label: 'Xotira', value: selectedProduct.storage },
                    { icon: '🎨', label: 'Rang', value: selectedProduct.color },
                    { icon: '📦', label: 'Ombor', value: selectedProduct.stock > 0 ? `${selectedProduct.stock} ta` : 'Tugagan' },
                  ].filter(s => s.value).map((s, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#475569', marginBottom: '3px' }}>{s.icon} {s.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {selectedProduct.description && <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{selectedProduct.description}</p>}

                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button className="btn-primary" onClick={() => { setSelectedProduct(null); setOrderModal(selectedProduct) }} disabled={selectedProduct.stock === 0}
                    style={{ flex: 1, padding: '13px', fontSize: '14px', opacity: selectedProduct.stock === 0 ? 0.4 : 1, cursor: selectedProduct.stock === 0 ? 'not-allowed' : 'pointer' }}>
                    {selectedProduct.stock === 0 ? 'Tugagan' : '🛒 Buyurtma berish'}
                  </button>
                  <button onClick={() => {
  const question = encodeURIComponent(`${selectedProduct.brand} ${selectedProduct.name} haqida ma'lumot ber`)
  setSelectedProduct(null)
  navigate(`/ai?ask=${question}`)
}} className="btn-neon" style={{ padding: '13px 16px', fontSize: '13px' }}>🤖 AI ga so'ra</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {orderModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => e.target === e.currentTarget && setOrderModal(null)}
        >
          <div className="glass-card" style={{ maxWidth: '380px', width: '100%', padding: '32px', boxShadow: '0 0 60px rgba(0,212,255,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Buyurtmani tasdiqlang</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Quyidagi mahsulotni buyurtma qilmoqchimisiz?</p>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9', marginBottom: '6px' }}>{orderModal.brand} {orderModal.name}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{formatPrice(orderModal.price)}</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setOrderModal(null)} className="btn-neon" style={{ flex: 1 }}>Bekor</button>
              <button onClick={confirmOrder} className="btn-primary" disabled={ordering} style={{ flex: 1, opacity: ordering ? 0.7 : 1 }}>
                {ordering ? 'Yuborilmoqda...' : '✅ Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000, padding: '14px 20px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: '12px', backdropFilter: 'blur(20px)', color: '#34d399', fontWeight: 600, fontSize: '14px', animation: 'fadeInUp 0.3s ease' }}>
          ✅ Buyurtma qabul qilindi!
        </div>
      )}
    </div>
  )
}