export default function ProductCard({ product, onClick, onOrder }) {
  const formatPrice = (price) =>
    new Intl.NumberFormat('uz-UZ').format(price) + " so'm"

  const imageSrc = product.image_data || product.image_url

  return (
    <div
      className="glass-card"
      onClick={onClick}
      style={{
        padding: '0', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        position: 'relative', cursor: 'pointer',
      }}
    >
      {/* Stock badge */}
      <div style={{
        position: 'absolute', top: '10px', right: '10px', zIndex: 2,
        padding: '3px 8px',
        background: product.stock > 5 ? 'rgba(52,211,153,0.15)' : product.stock > 0 ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)',
        border: `1px solid ${product.stock > 5 ? 'rgba(52,211,153,0.4)' : product.stock > 0 ? 'rgba(251,191,36,0.4)' : 'rgba(239,68,68,0.4)'}`,
        borderRadius: '20px', fontSize: '10px', fontWeight: 600,
        color: product.stock > 5 ? '#34d399' : product.stock > 0 ? '#fbbf24' : '#f87171',
      }}>
        {product.stock > 0 ? `${product.stock} ta` : 'Tugagan'}
      </div>

      {/* Image */}
      <div style={{
        height: '160px',
        background: 'linear-gradient(135deg, rgba(0,212,255,0.04), rgba(167,139,250,0.04))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            style={{
              maxHeight: '140px', maxWidth: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 16px rgba(0,212,255,0.15))',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{ fontSize: '52px', opacity: 0.2 }}>📱</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#00d4ff', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {product.brand}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>
          {product.name}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[product.ram, product.storage, product.color].filter(Boolean).map((s, i) => (
            <span key={i} style={{
              padding: '2px 8px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '5px', fontSize: '11px', color: '#94a3b8',
            }}>{s}</span>
          ))}
        </div>
        <div style={{
          marginTop: 'auto', paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: '15px', fontWeight: 800,
            background: 'linear-gradient(135deg, #00d4ff, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {formatPrice(product.price)}
          </div>
          <button
            className="btn-primary"
            onClick={e => { e.stopPropagation(); onOrder(product) }}
            disabled={product.stock === 0}
            style={{
              padding: '7px 14px', fontSize: '12px',
              opacity: product.stock === 0 ? 0.4 : 1,
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {product.stock === 0 ? 'Tugagan' : '🛒'}
          </button>
        </div>
      </div>
    </div>
  )
}
