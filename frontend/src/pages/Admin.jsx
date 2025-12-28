import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'

const initialCakes = []
const initialOrders = []

export default function Admin() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [cakes, setCakes] = useState(initialCakes)
  const [orders, setOrders] = useState(initialOrders)
  const [reviews, setReviews] = useState([])

  const [editingId, setEditingId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // form now supports cupcakes/brownies + images
  const [form, setForm] = useState({
    name: '',
    category: '',
    priceHalfKg: '',
    priceOneKg: '',
    price: '',
    price250g: '',
    imagesText: '',   // comma-separated image paths/URLs
  })

  // filters for orders
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('All')

  // include all categories used in cakes.json
  const categories = useMemo(
    () => [
      'Classic',
      'Fresh Fruit',
      'Chocolate',
      'Summer Special',
      'Special Cakes',
      'Cupcakes',
      'Brownies',
      'Designer',
    ],
    []
  )

  function resetForm() {
    setForm({
      name: '',
      category: '',
      priceHalfKg: '',
      priceOneKg: '',
      price: '',
      price250g: '',
      imagesText: '',
    })
  }

  useEffect(() => {
    async function load() {
      try {
        const [cakesRes, ordersRes, reviewsRes] = await Promise.all([
          fetch('/api/cakes'),
          fetch('/api/orders'),
          fetch('/api/reviews'),
        ])
        const [cakesData, ordersData, reviewsData] = await Promise.all([
          cakesRes.json(),
          ordersRes.json(),
          reviewsRes.json(),
        ])
        setCakes(Array.isArray(cakesData) ? cakesData : [])
        setOrders(Array.isArray(ordersData) ? ordersData : [])
        setReviews(Array.isArray(reviewsData) ? reviewsData : [])
      } catch (e) {
        // ignore for now
      }
    }
    load()
  }, [])

  // helper -> safe number or null
  function toNumberOrNull(val) {
    if (val === '' || val === null || val === undefined) return null
    const n = Number(val)
    return Number.isNaN(n) ? null : n
  }

  // build payload based on category
  function buildCakePayload() {
    const isCupcake = form.category === 'Cupcakes'
    const isBrownie = form.category === 'Brownies'

    const images =
      form.imagesText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean) || []

    return {
      name: form.name,
      category: form.category || null,
      // classic / chocolate / etc
      priceHalfKg: isCupcake || isBrownie ? null : toNumberOrNull(form.priceHalfKg),
      priceOneKg: isCupcake || isBrownie ? null : toNumberOrNull(form.priceOneKg),
      // cupcakes
      price: isCupcake ? toNumberOrNull(form.price) : null,
      // brownies
      price250g: isBrownie ? toNumberOrNull(form.price250g) : null,
      images,
    }
  }

  async function addCake(e) {
    e.preventDefault()
    if (!form.name || !form.category) return

    const payload = buildCakePayload()

    const res = await fetch('/api/cakes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const created = await res.json()
      setCakes(prev => [...prev, created])
      resetForm()
    }
  }

  function startEdit(cake) {
    setEditingId(cake.id)
    setForm({
      name: cake.name || '',
      category: cake.category || '',
      priceHalfKg: cake.priceHalfKg ?? '',
      priceOneKg: cake.priceOneKg ?? '',
      price: cake.price ?? '',
      price250g: cake.price250g ?? '',
      imagesText: (cake.images || []).join(', '),
    })
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editingId) return

    const payload = buildCakePayload()

    const res = await fetch(`/api/cakes/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const updated = await res.json()
      setCakes(prev => prev.map(c => (c.id === editingId ? updated : c)))
      setEditingId(null)
      resetForm()
    }
  }

  async function removeCake(id) {
    if (!window.confirm('Delete this cake permanently?')) return
    const res = await fetch(`/api/cakes/${id}`, { method: 'DELETE' })
    if (res.ok) setCakes(prev => prev.filter(c => c.id !== id))
  }

  // toggle status Pending <-> Completed (other statuses can be added later)
  async function toggleOrderStatus(order) {
    const next = order.status === 'Completed' ? 'Pending' : 'Completed'
    const res = await fetch(
      `/api/orders/${order.id}/status?status=${encodeURIComponent(next)}`,
      { method: 'PUT' }
    )
    if (res.ok) {
      const updated = await res.json()
      setOrders(prev => prev.map(o => (o.id === order.id ? updated : o)))
      if (selectedOrder && selectedOrder.id === order.id) setSelectedOrder(updated)
    }
  }

  async function deleteOrder(orderId) {
    if (!window.confirm('Delete this order?')) return
    const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' })
    if (res.ok) {
      setOrders(prev => prev.filter(o => o.id !== orderId))
      if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null)
    }
  }

  // Reviews management functions
  async function deleteReview(reviewId) {
    if (!window.confirm('Delete this review permanently?')) return
    const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
    if (res.ok) setReviews(prev => prev.filter(r => r.id !== reviewId))
  }

  async function togglePinReview(reviewId) {
    const res = await fetch(`/api/reviews/${reviewId}/pin`, { method: 'PATCH' })
    if (res.ok) {
      const updated = await res.json()
      setReviews(prev => prev.map(r => r.id === reviewId ? updated : r))
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{
        color: i < rating ? '#fbbf24' : '#e5e7eb',
        fontSize: '14px'
      }}>
        ★
      </span>
    ))
  }

  // filters for orders
  const filteredOrders = useMemo(() => {
    const q = orderSearch.toLowerCase().trim()
    return orders.filter(o => {
      if (orderStatusFilter !== 'All' && o.status !== orderStatusFilter) return false

      if (!q) return true
      return (
        String(o.id).includes(q) ||
        (o.name && o.name.toLowerCase().includes(q)) ||
        (o.cake && o.cake.toLowerCase().includes(q)) ||
        (o.phone && String(o.phone).toLowerCase().includes(q))
      )
    })
  }, [orders, orderSearch, orderStatusFilter])

  // price display helper used in Existing Cakes section
  function renderCakePriceRow(cake) {
    if (cake.category === 'Cupcakes') {
      return (
        <span
          style={{
            background: 'var(--gray-light)',
            padding: '2px 8px',
            borderRadius: 6,
          }}
        >
          Price: ₹{cake.price ?? '—'}
        </span>
      )
    }

    if (cake.category === 'Brownies') {
      return (
        <span
          style={{
            background: 'var(--gray-light)',
            padding: '2px 8px',
            borderRadius: 6,
          }}
        >
          250 g: ₹{cake.price250g ?? '—'}
        </span>
      )
    }

    return (
      <>
        {cake.priceHalfKg != null && (
          <span
            style={{
              background: 'var(--gray-light)',
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            ½ kg: ₹{cake.priceHalfKg}
          </span>
        )}
        {cake.priceOneKg != null && (
          <span
            style={{
              background: 'var(--gray-light)',
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            1 kg: ₹{cake.priceOneKg}
          </span>
        )}
      </>
    )
  }

  return (
    <div className="admin">
      <div
        className="admin-layout"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <aside
          className="admin-sidebar"
          style={{
            flex: '0 0 220px',
            minWidth: 200,
          }}
        >
          <h3>Admin</h3>
          <ul>
            <li className="professional-hover">Add / Edit Cakes</li>
            <li className="professional-hover">View Orders</li>
          </ul>
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            style={{
              marginTop: '20px',
              padding: '10px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%'
            }}
          >
            Logout
          </button>
        </aside>

        <section
          className="admin-content"
          style={{
            flex: '1 1 300px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* ADD / EDIT CAKE */}
          <div className="card" style={{ padding: 20 }}>
            <h3>{editingId ? 'Edit Cake' : 'Add New Cake'}</h3>
            <form className="form" onSubmit={editingId ? saveEdit : addCake}>
              <label>
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={e =>
                    setForm(f => ({ ...f, name: e.target.value }))
                  }
                />
              </label>

              <label>
                <span>Category</span>
                <select
                  value={form.category}
                  onChange={e =>
                    setForm(f => ({ ...f, category: e.target.value }))
                  }
                >
                  <option value="">Select</option>
                  {categories.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              {/* Dynamic price fields based on category */}
              {form.category === 'Cupcakes' ? (
                <label>
                  <span>Price per piece (₹)</span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e =>
                      setForm(f => ({ ...f, price: e.target.value }))
                    }
                  />
                </label>
              ) : form.category === 'Brownies' ? (
                <label>
                  <span>Price (250 g) (₹)</span>
                  <input
                    type="number"
                    value={form.price250g}
                    onChange={e =>
                      setForm(f => ({ ...f, price250g: e.target.value }))
                    }
                  />
                </label>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                    gap: 12,
                  }}
                >
                  <label>
                    <span>Half kg Price (₹)</span>
                    <input
                      type="number"
                      value={form.priceHalfKg}
                      onChange={e =>
                        setForm(f => ({ ...f, priceHalfKg: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span>1 kg Price (₹)</span>
                    <input
                      type="number"
                      value={form.priceOneKg}
                      onChange={e =>
                        setForm(f => ({ ...f, priceOneKg: e.target.value }))
                      }
                    />
                  </label>
                </div>
              )}

              {/* images text input */}
              <label>
                <span>Image paths (comma separated)</span>
                <input
                  placeholder="/src/images_cake/bs_1.jpg, /src/images_cake/bs_2.jpg"
                  value={form.imagesText}
                  onChange={e =>
                    setForm(f => ({ ...f, imagesText: e.target.value }))
                  }
                />
              </label>

              <div style={{ marginTop: 8 }}>
                <button className="btn" type="submit">
                  {editingId ? 'Save Changes' : 'Add Cake'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn"
                    style={{ marginLeft: 10, background: '#6b7280' }}
                    onClick={() => {
                      setEditingId(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* EXISTING CAKES */}
          <div className="card" style={{ padding: 0 }}>
            <div
              style={{
                padding: 20,
                borderBottom: '1px solid var(--gray-medium)',
              }}
            >
              <h3>Existing Cakes</h3>
            </div>
            <div
              style={{
                padding: 20,
                display: 'grid',
                gap: 12,
              }}
            >
              {cakes.map(cake => (
                <div
                  key={cake.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0,1fr) auto',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {/* small thumbnail */}
                  <div>
                    {cake.images && cake.images.length > 0 && (
                      <img
                        src={cake.images[0]}
                        alt={cake.name}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          objectFit: 'cover',
                          background: '#f3f3f3',
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <strong>{cake.name}</strong>{' '}
                    <span style={{ color: 'var(--text-muted)' }}>
                      ({cake.category})
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      {renderCakePriceRow(cake)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <button
                      type="button"
                      className="btn"
                      onClick={() => startEdit(cake)}
                      style={{ padding: '6px 10px' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => removeCake(cake.id)}
                      style={{
                        padding: '6px 10px',
                        background: '#ef4444',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {!cakes.length && (
                <div style={{ color: 'var(--text-muted)' }}>
                  No cakes found in database.
                </div>
              )}
            </div>
          </div>

          {/* ORDERS LIST */}
          <div className="card" style={{ padding: 0 }}>
            <div
              style={{
                padding: 20,
                borderBottom: '1px solid var(--gray-medium)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3>Recent Orders</h3>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <input
                  placeholder="Search by name / cake / phone"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--gray-medium)',
                    minWidth: 180,
                  }}
                />
                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--gray-medium)',
                  }}
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div
              style={{
                padding: 20,
                display: 'grid',
                gap: 12,
              }}
            >
              {filteredOrders.map(o => (
                <div
                  key={o.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1fr) auto auto',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div>
                    <strong>#{o.id}</strong> {o.name} - {o.cake} × {o.quantity}
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {o.weight && <>Weight: {o.weight} · </>}
                      {o.deliveryDate && <>Date: {o.deliveryDate}</>}
                    </div>
                    <div
                      style={{
                        color:
                          o.status === 'Completed'
                            ? 'var(--success)'
                            : 'var(--warning)',
                        fontWeight: 600,
                      }}
                    >
                      {o.status}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: '8px 12px' }}
                    onClick={() => setSelectedOrder(o)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      padding: '8px 12px',
                      background:
                        o.status === 'Completed' ? '#f59e0b' : '#10b981',
                    }}
                    onClick={() => toggleOrderStatus(o)}
                  >
                    {o.status === 'Completed'
                      ? 'Mark Pending'
                      : 'Mark Completed'}
                  </button>
                </div>
              ))}
              {!filteredOrders.length && (
                <div style={{ color: 'var(--text-muted)' }}>
                  No orders match your filters.
                </div>
              )}
            </div>
          </div>

          {/* ORDER DETAILS MODAL */}
          {selectedOrder && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
                padding: 16,
              }}
              onClick={() => setSelectedOrder(null)}
            >
              <div
                className="card"
                style={{
                  width: '100%',
                  maxWidth: 420,
                  padding: 20,
                  background: 'var(--bg-card)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <h3>Order Details</h3>
                <div style={{ marginTop: 10, display: 'grid', gap: 4 }}>
                  <div>
                    <strong>Order ID:</strong> #{selectedOrder.id}
                  </div>
                  <div>
                    <strong>Name:</strong> {selectedOrder.name}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedOrder.phone || '—'}
                  </div>
                  <div>
                    <strong>Address:</strong> {selectedOrder.address || '—'}
                  </div>
                  <div>
                    <strong>Cake:</strong> {selectedOrder.cake}
                  </div>
                  <div>
                    <strong>Weight:</strong> {selectedOrder.weight || '—'}
                  </div>
                  <div>
                    <strong>Quantity:</strong> {selectedOrder.quantity}
                  </div>
                  <div>
                    <strong>Delivery Date:</strong>{' '}
                    {selectedOrder.deliveryDate || '—'}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedOrder.status}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className="btn"
                    onClick={() => toggleOrderStatus(selectedOrder)}
                  >
                    {selectedOrder.status === 'Completed'
                      ? 'Mark Pending'
                      : 'Mark Completed'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ background: '#ef4444' }}
                    onClick={() => deleteOrder(selectedOrder.id)}
                  >
                    Delete Order
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REVIEWS MANAGEMENT */}
          <div className="card" style={{ padding: 0 }}>
            <div
              style={{
                padding: 20,
                borderBottom: '1px solid var(--gray-medium)',
              }}
            >
              <h3>Customer Reviews</h3>
            </div>
            <div
              style={{
                padding: 20,
                display: 'grid',
                gap: 12,
              }}
            >
              {reviews.map(r => (
                <div
                  key={r.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px',
                    border: r.pinned ? '2px solid #fbbf24' : '1px solid var(--gray-light)',
                    borderRadius: '8px',
                    background: r.pinned ? '#fefce8' : 'white',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    {renderStars(r.rating)}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {r.rating}/5
                    </span>
                  </div>
                  <div>
                    <strong>{r.name}</strong> - <span style={{ color: 'var(--text-muted)' }}>{r.date}</span>
                    {r.pinned && (
                      <span style={{
                        display: 'inline-block',
                        background: '#fbbf24',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        marginLeft: '8px'
                      }}>
                        📌 Pinned
                      </span>
                    )}
                    <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                      "{r.comment}"
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => togglePinReview(r.id)}
                    style={{
                      padding: '8px 12px',
                      background: r.pinned ? '#6b7280' : '#10b981',
                      fontSize: '14px',
                    }}
                  >
                    {r.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => deleteReview(r.id)}
                    style={{
                      padding: '8px 12px',
                      background: '#ef4444',
                      fontSize: '14px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
              {!reviews.length && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                  No reviews yet. Reviews will appear here when customers submit them.
                </div>
              )}
            </div>
          </div>

        </section>
      </div>
    </div>
  )
}
