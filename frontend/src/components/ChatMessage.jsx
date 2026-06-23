export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px',
      animation: 'fadeInUp 0.3s ease',
    }}>
      {/* AI Avatar */}
      {!isUser && (
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #00d4ff, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', marginRight: '10px', flexShrink: 0,
          boxShadow: '0 0 15px rgba(0,212,255,0.3)',
          alignSelf: 'flex-end',
        }}>🤖</div>
      )}

      <div style={{
        maxWidth: '75%',
        padding: '12px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser
          ? 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(167,139,250,0.2))'
          : 'rgba(255,255,255,0.06)',
        border: `1px solid ${isUser ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
        color: '#f1f5f9',
        fontSize: '14px',
        lineHeight: 1.6,
        backdropFilter: 'blur(10px)',
      }}>
        {message.content}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', marginLeft: '10px', flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.15)',
          alignSelf: 'flex-end',
        }}>👤</div>
      )}
    </div>
  )
}
