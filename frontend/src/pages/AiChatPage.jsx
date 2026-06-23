import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const STORAGE_KEY = 'ai_chats'

const createChat = () => ({
  id: Date.now().toString(),
  title: 'Yangi suhbat',
  messages: [],
  createdAt: new Date().toISOString(),
})

const loadChats = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

const saveChats = (chats) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
}

export default function AiChatPage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const bottomRef = useRef(null)

  const [chats, setChats] = useState(() => loadChats())
  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = loadChats()
    return saved.length > 0 ? saved[0].id : null
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const activeChat = chats.find(c => c.id === activeChatId)
  const messages = activeChat?.messages || []

  // Chats o'zgarganda saqlash
  useEffect(() => {
    saveChats(chats)
  }, [chats])

  // Scroll pastga
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Yangi chat boshlanganda salom xabari
  useEffect(() => {
    if (activeChatId && activeChat && activeChat.messages.length === 0) {
      setTimeout(() => {
        setChats(prev => prev.map(c => c.id === activeChatId ? {
          ...c,
          messages: [{
            role: 'assistant',
            content: `Salom, ${user.first_name}! 👋 Men AiSavdo konsultantiman. Sizga mos telefon topishda yordam beraman. Qanday telefon qidiryapsiz? 😊`,
            type: 'text',
          }]
        } : c))
      }, 400)
    }
  }, [activeChatId])

  useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const ask = params.get('ask')
  if (ask && activeChatId) {
    setTimeout(() => {
      sendMessage(decodeURIComponent(ask))
      window.history.replaceState({}, '', '/ai')
    }, 800)
  }
}, [activeChatId])

  const createNewChat = () => {
    const newChat = createChat()
    setChats(prev => [newChat, ...prev])
    setActiveChatId(newChat.id)
    setInput('')
  }

  const deleteChat = (chatId) => {
    const remaining = chats.filter(c => c.id !== chatId)
    setChats(remaining)
    setDeleteConfirm(null)
    if (activeChatId === chatId) {
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id)
      } else {
        const newChat = createChat()
        setChats([newChat])
        setActiveChatId(newChat.id)
      }
    }
  }

  const updateMessages = (chatId, newMessages) => {
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c
      // Title birinchi user xabardan
      const firstUserMsg = newMessages.find(m => m.role === 'user')
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
        : c.title
      return { ...c, messages: newMessages, title }
    }))
  }

  const sendMessage = async (text) => {
    if (!text.trim() || loading || !activeChatId) return

    const userMsg = { role: 'user', content: text, type: 'text' }
    const newMessages = [...messages, userMsg]
    updateMessages(activeChatId, newMessages)
    setInput('')
    setLoading(true)

    try {
      const apiMessages = newMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      const { data } = await api.post('/api/ai/chat', { messages: apiMessages })

      let aiMsg
      if (data.type === 'order_success') {
        aiMsg = { role: 'assistant', content: data.content, type: 'order_success', order: data.order }
        setOrderSuccess(data.order)
        setTimeout(() => setOrderSuccess(null), 5000)
      } else if (data.type === 'confirm_order') {
        aiMsg = { role: 'assistant', content: data.content, type: 'confirm_order', product_id: data.product_id, product_name: data.product_name, price: data.price }
      } else if (data.type === 'buttons') {
        aiMsg = { role: 'assistant', content: data.content, type: 'buttons', buttons: data.buttons }
      } else if (data.type === 'products') {
        aiMsg = { role: 'assistant', content: data.content, type: 'products', products: data.products }
      } else {
        aiMsg = { role: 'assistant', content: data.content, type: 'text' }
      }
      updateMessages(activeChatId, [...newMessages, aiMsg])
    } catch {
      updateMessages(activeChatId, [...newMessages, {
        role: 'assistant',
        content: "Kechirasiz, xatolik yuz berdi. Qayta urinib ko'ring.",
        type: 'text',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmOrder = async (yes, productId, productName, price) => {
    if (!yes) {
      updateMessages(activeChatId, [...messages, {
        role: 'assistant',
        content: "Buyurtma bekor qilindi. Boshqa telefon ko'rasizmi? 😊",
        type: 'text',
      }])
      return
    }
    setLoading(true)
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      await api.post('/api/orders/', {
        product_id: productId,
        client_first_name: u.first_name,
        client_last_name: u.last_name,
        client_phone: u.phone,
      })
      updateMessages(activeChatId, [...messages, {
        role: 'assistant',
        content: `✅ Buyurtmangiz qabul qilindi! ${productName} uchun tez orada siz bilan bog'lanamiz. Boshqa savollaringiz bo'lsa yozing 😊`,
        type: 'text',
      }])
    } catch {
      updateMessages(activeChatId, [...messages, {
        role: 'assistant',
        content: "Xatolik yuz berdi. Qayta urinib ko'ring.",
        type: 'text',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Sanani formatlash
  const formatDate = (iso) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Bugun'
    if (d.toDateString() === yesterday.toDateString()) return 'Kecha'
    return d.toLocaleDateString('uz-UZ')
  }

  // Chatlarni sanalar bo'yicha guruhlash
  const groupedChats = chats.reduce((acc, chat) => {
    const date = formatDate(chat.createdAt)
    if (!acc[date]) acc[date] = []
    acc[date].push(chat)
    return acc
  }, {})

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user'

    if (isUser) {
      return (
        <div key={index} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ maxWidth: '70%', padding: '12px 16px', borderRadius: '16px 16px 4px 16px', background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(167,139,250,0.2))', border: '1px solid rgba(0,212,255,0.3)', color: '#f1f5f9', fontSize: '14px', lineHeight: 1.6 }}>{msg.content}</div>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginLeft: '10px', flexShrink: 0, alignSelf: 'flex-end' }}>👤</div>
        </div>
      )
    }

    return (
      <div key={index} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px', animation: 'fadeInUp 0.3s ease' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginRight: '10px', flexShrink: 0, boxShadow: '0 0 15px rgba(0,212,255,0.3)', alignSelf: 'flex-start', marginTop: '4px' }}>🤖</div>

        <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {msg.content && (
            <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: '14px', lineHeight: 1.6 }}>{msg.content}</div>
          )}

          {msg.type === 'buttons' && msg.buttons && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {msg.buttons.map((btn, i) => (
                <button key={i} onClick={() => sendMessage(btn.value)} style={{ padding: '8px 16px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '20px', color: '#00d4ff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.target.style.background = 'rgba(0,212,255,0.2)'; e.target.style.boxShadow = '0 0 15px rgba(0,212,255,0.3)' }}
                  onMouseLeave={e => { e.target.style.background = 'rgba(0,212,255,0.1)'; e.target.style.boxShadow = 'none' }}
                >{btn.label}</button>
              ))}
            </div>
          )}

          {msg.type === 'products' && msg.products && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {msg.products.map((product, i) => (
                <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.background = 'rgba(0,212,255,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#00d4ff', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>{product.brand}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>{product.name}</div>
                  {product.message && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{product.message}</div>}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {product.ram && <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '12px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>💾 {product.ram}</span>}
                    {product.storage && <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '12px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>📀 {product.storage}</span>}
                    {product.color && <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '12px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>🎨 {product.color}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {new Intl.NumberFormat('uz-UZ').format(product.price)} so'm
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => navigate(`/?product_id=${product.id}`)} style={{ padding: '7px 12px', fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.target.style.color = '#f1f5f9'}
                        onMouseLeave={e => e.target.style.color = '#94a3b8'}
                      >Batafsil →</button>
                      <button onClick={() => sendMessage(`${product.brand} ${product.name} ni buyurtma bermoqchiman`)} className="btn-primary" style={{ padding: '7px 14px', fontSize: '12px' }}>🛒 Buyurtma</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {msg.type === 'confirm_order' && (
            <div style={{ padding: '16px', background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>{msg.product_name}</div>
              <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {msg.price ? new Intl.NumberFormat('uz-UZ').format(msg.price) + " so'm" : ''}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleConfirmOrder(true, msg.product_id, msg.product_name, msg.price)} className="btn-primary" style={{ padding: '9px 18px', fontSize: '13px' }}>✅ Ha, buyurtma beraman</button>
                <button onClick={() => handleConfirmOrder(false, null, null, null)} className="btn-neon" style={{ padding: '9px 18px', fontSize: '13px' }}>❌ Yo'q</button>
              </div>
            </div>
          )}

          {msg.type === 'order_success' && msg.order && (
            <div style={{ padding: '16px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: '#34d399', fontWeight: 600, marginBottom: '8px' }}>✅ Buyurtma #{msg.order.id} qabul qilindi!</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                📱 {msg.order.product_name}<br />
                💰 {new Intl.NumberFormat('uz-UZ').format(msg.order.price)} so'm<br />
                📬 Telegram ga xabar yuborildi
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', overflow: 'hidden' }}>

      {/* ─── SIDEBAR ─── */}
      <div style={{
        width: sidebarOpen ? '260px' : '0px',
        minWidth: sidebarOpen ? '260px' : '0px',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        background: 'rgba(3,7,18,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* New Chat */}
        <div style={{ padding: '16px 12px 8px' }}>
          <button onClick={createNewChat} style={{
            width: '100%', padding: '11px 16px',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(167,139,250,0.15))',
            border: '1px solid rgba(0,212,255,0.25)',
            borderRadius: '10px', color: '#00d4ff',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(167,139,250,0.25))'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(167,139,250,0.15))'}
          >
            <span style={{ fontSize: '16px' }}>✏️</span> Yangi suhbat
          </button>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {Object.entries(groupedChats).map(([date, dateChats]) => (
            <div key={date}>
              <div style={{ padding: '8px 8px 4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {date}
              </div>
              {dateChats.map(chat => (
                <div
                  key={chat.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 10px', borderRadius: '8px', marginBottom: '2px',
                    background: activeChatId === chat.id ? 'rgba(0,212,255,0.1)' : 'transparent',
                    border: `1px solid ${activeChatId === chat.id ? 'rgba(0,212,255,0.2)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  onClick={() => setActiveChatId(chat.id)}
                  onMouseEnter={e => {
                    if (activeChatId !== chat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.querySelector('.delete-btn').style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    if (activeChatId !== chat.id) e.currentTarget.style.background = 'transparent'
                    e.currentTarget.querySelector('.delete-btn').style.opacity = '0'
                  }}
                >
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>💬</span>
                  <span style={{ fontSize: '13px', color: activeChatId === chat.id ? '#f1f5f9' : '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.title}
                  </span>
                  <button
                    className="delete-btn"
                    onClick={e => { e.stopPropagation(); setDeleteConfirm(chat.id) }}
                    style={{
                      opacity: 0, flexShrink: 0,
                      width: '24px', height: '24px',
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '6px', color: '#f87171',
                      fontSize: '11px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'opacity 0.2s',
                    }}
                  >🗑️</button>
                </div>
              ))}
            </div>
          ))}

          {chats.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#334155', fontSize: '13px' }}>
              Hali suhbat yo'q
            </div>
          )}
        </div>
      </div>

      {/* ─── MAIN CHAT ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            width: '36px', height: '36px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
            color: '#94a3b8', cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>☰</button>

          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 0 16px rgba(0,212,255,0.3)', animation: 'pulse-glow 2s infinite' }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9' }}>Amal — AI Konsultant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.6)', animation: 'pulse-glow 1.5s infinite' }} />
              <span style={{ fontSize: '12px', color: '#34d399' }}>Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          {!activeChatId || messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🤖</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Amal bilan suhbat boshlang</div>
              <div style={{ fontSize: '14px', color: '#334155' }}>Telefon haqida savol bering yoki byudjetingizni ayting</div>
              <button onClick={createNewChat} style={{
                marginTop: '24px', padding: '12px 24px',
                background: 'linear-gradient(135deg, #00d4ff, #a78bfa)',
                border: 'none', borderRadius: '10px', color: '#000',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              }}>✏️ Yangi suhbat boshlash</button>
            </div>
          ) : (
            messages.map((msg, i) => renderMessage(msg, i))
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', animation: 'fadeInUp 0.3s ease' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #00d4ff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', boxShadow: '0 0 15px rgba(0,212,255,0.3)' }}>🤖</div>
              <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00d4ff', animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px 16px' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Xabar yozing... (Enter — yuborish)"
              rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '14px', resize: 'none', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, maxHeight: '120px', overflowY: 'auto' }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading || !activeChatId}
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: input.trim() && !loading && activeChatId ? 'linear-gradient(135deg, #00d4ff, #a78bfa)' : 'rgba(255,255,255,0.08)',
                border: 'none', cursor: input.trim() && !loading && activeChatId ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', transition: 'all 0.2s', flexShrink: 0,
                boxShadow: input.trim() && !loading ? '0 0 15px rgba(0,212,255,0.3)' : 'none',
              }}
            >{loading ? '⏳' : '➤'}</button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#334155' }}>
            AI faqat bazadagi mavjud mahsulotlarni tavsiya qiladi
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '32px', maxWidth: '340px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: '#f1f5f9' }}>Suhbatni o'chirish</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Bu suhbat o'chirilsin? Qaytarib bo'lmaydi.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}>Bekor</button>
              <button onClick={() => deleteChat(deleteConfirm)} style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', color: '#f87171', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>O'chirish</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {orderSuccess && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000, padding: '16px 24px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: '12px', backdropFilter: 'blur(20px)', color: '#34d399', fontWeight: 600, fontSize: '14px', animation: 'fadeInUp 0.3s ease', boxShadow: '0 0 30px rgba(52,211,153,0.2)' }}>
          ✅ Buyurtma qabul qilindi! Telegram ga xabar yuborildi.
        </div>
      )}
    </div>
  )
}
