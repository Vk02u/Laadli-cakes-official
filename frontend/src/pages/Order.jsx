import { useEffect, useState } from 'react'

export default function Order() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    category: 'All',
    cake: '',
    weight: '0.5kg',
    quantity: 1,
    deliveryDate: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [cakes, setCakes] = useState([])

  useEffect(() => {
    let ignore = false
    async function loadCakes() {
      try {
        const res = await fetch('/api/cakes')
        if (!res || !res.ok) return
        const data = await res.json()
        if (!ignore) setCakes(Array.isArray(data) ? data : [])
      } catch {}
    }
    loadCakes()
    return () => { ignore = true }
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }))
  }

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!/^\+?\d{10,}$/.test(form.phone)) next.phone = 'Valid phone is required'
    if (form.address.trim().length < 6) next.address = 'Address is too short'
    if (!form.category || form.category === 'All') next.category = 'Select a category'
    if (!form.cake) next.cake = 'Select a cake'
    if (!form.weight) next.weight = 'Select weight'
    if (!form.deliveryDate) next.deliveryDate = 'Delivery date is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
          cake: form.cake,
          weight: form.weight,
          quantity: Number(form.quantity) || 1,
          deliveryDate: form.deliveryDate,
        })
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const txt = await res.text()
        alert('Failed to submit order: ' + txt)
      }
    } catch (err) {
      alert('Network error submitting order')
    }
  }

  // --- UI helpers ---
  const categories = ['All', ...Array.from(new Set(cakes.map(c => c.category)))]

  // cakes filtered by selected category (if 'All', show all)
  const cakesForCategory = cakes.filter(c => {
    return form.category === 'All' || c.category === form.category
  })

  // find selected cake object
  const selectedCake = cakes.find(c => String(c.id) === String(cakesForCategory.find(x => x.name === form.cake)?.id ?? (cakes.find(cc => cc.name === form.cake)?.id ?? '')) )
    // Above ensures mapping by name when cake selected from filtered list.
    // Simpler approach: we will instead find by name directly:
  const selectedCakeByName = cakes.find(c => c.name === form.cake)
  // use selectedCakeByName below
  const cakeObj = selectedCakeByName || null

  // compute price for selected weight (robust handling)
  function computePrice(cake, weight) {
    if (!cake) return null
    // Cupcakes have 'price'
    if (cake.category === 'Cupcakes') {
      return cake.price ?? null
    }
    // Brownies may have price250g
    if (weight === '250g') {
      return cake.price250g ?? null
    }
    if (weight === '0.5kg') {
      return cake.priceHalfKg ?? null
    }
    if (weight === '1kg') {
      return cake.priceOneKg ?? null
    }
    return null
  }

  const priceForWeight = computePrice(cakeObj, form.weight)

  // For display: format number or fallback message
  function priceDisplay(val) {
    if (val === null || val === undefined) return 'Price not available'
    return `₹${val}`
  }

  return (
    <section className="order">
  <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700 }}>
    Place Your Order
  </h2>

      {submitted ? (
        <div className="success">Thank you! We will confirm your order shortly.</div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          <form className="form" onSubmit={handleSubmit} noValidate>
            <label>
              <span>Name</span>
              <input name="name" value={form.name} onChange={handleChange} />
              {errors.name && <small className="error">{errors.name}</small>}
            </label>

            <label>
              <span>Phone</span>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="10+ digits" />
              {errors.phone && <small className="error">{errors.phone}</small>}
            </label>

            <label>
              <span>Address</span>
              <textarea name="address" value={form.address} onChange={handleChange} />
              {errors.address && <small className="error">{errors.address}</small>}
            </label>

            {/* Category + Cake select (category filters cake list) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                <span>Category</span>
                <select name="category" value={form.category} onChange={(e) => {
                  // selecting category resets cake selection
                  setForm(prev => ({ ...prev, category: e.target.value, cake: '' }))
                }}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {errors.category && <small className="error">{errors.category}</small>}
              </label>

              <label>
                <span>Cake</span>
                <select name="cake" value={form.cake} onChange={handleChange}>
                  <option value="">Select</option>
                  {cakesForCategory.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.cake && <small className="error">{errors.cake}</small>}
              </label>
            </div>

            {/* if cake selected, show small preview + price info */}
            {cakeObj && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
                <img
                  src={ (cakeObj.images && cakeObj.images.length) ? (cakeObj.images[0].startsWith('/src/') ? cakeObj.images[0] : `http://localhost:4000${cakeObj.images[0]}`) : ''}
                  alt={cakeObj.name}
                  style={{ width: 86, height: 86, objectFit: 'cover', borderRadius: 6, background: '#f3f3f3' }}
                />
                <div style={{ color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 600 }}>{cakeObj.name}</div>
                  <div style={{ fontSize: 13 }}>{cakeObj.category}</div>
                </div>
              </div>
            )}

            {/* Weight + Quantity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
              <label>
                <span>Weight</span>
                <select name="weight" value={form.weight} onChange={handleChange}>
                  {/* show 250g option (useful for Brownies) */}
                  <option value="250g">250 g</option>
                  <option value="0.5kg">½ kg</option>
                  <option value="1kg">1 kg</option>
                </select>
                {errors.weight && <small className="error">{errors.weight}</small>}
              </label>

              <label>
                <span>Quantity</span>
                <input type="number" min="1" name="quantity" value={form.quantity} onChange={handleChange} />
              </label>
            </div>

            {/* show computed price for selected cake+weight */}
            {form.cake && (
              <div style={{ marginTop: 8, marginBottom: 6, color: 'var(--text-muted)' }}>
                Selected price: <strong>{ priceForWeight === null ? 'Not available / Contact for price' : `₹${priceForWeight}` }</strong>
              </div>
            )}

            <label>
              <span>Delivery Date</span>
              <input type="date" name="deliveryDate" value={form.deliveryDate} onChange={handleChange} />
              {errors.deliveryDate && <small className="error">{errors.deliveryDate}</small>}
            </label>

            <button className="btn" type="submit" disabled={!cakes.length}>Submit Order</button>
          </form>
        </div>
      )}
    </section>
  )
}
