import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement)

export default function Analytics() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  // -----------------------------
  // STATE (REAL DATA)
  // -----------------------------
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    revenue: 0
  })

  // -----------------------------
  // FETCH ANALYTICS FROM BACKEND
  // -----------------------------
  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/analytics')
        if (!res.ok) return
        const data = await res.json()
        setStats(data)
      } catch (e) {
        console.error('Failed to load analytics')
      }
    }
    loadAnalytics()
  }, [])

  const { totalOrders, completedOrders, pendingOrders, revenue } = stats

  // -----------------------------
  // BAR CHART (weekly – placeholder)
  // -----------------------------
  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders',
        data: [0, 0, 0, 0, 0, 0, 0], // future backend integration
        backgroundColor: '#f8bbd9',
        borderColor: '#f48fb1',
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  }

  // -----------------------------
  // DONUT CHART (REAL DATA)
  // -----------------------------
  const donutData = {
    labels: ['Completed Orders', 'Pending Orders'],
    datasets: [
      {
        data: [completedOrders, pendingOrders],
        backgroundColor: ['#81c784', '#ffb74d'],
        borderColor: ['#4caf50', '#ff9800'],
        borderWidth: 3,
        hoverOffset: 8
      }
    ]
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 14, weight: '600' }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const percentage =
              totalOrders > 0
                ? ((context.raw / totalOrders) * 100).toFixed(1)
                : 0
            return `${context.label}: ${context.raw} (${percentage}%)`
          }
        }
      }
    },
    cutout: '65%'
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <section className="analytics">
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <button
          onClick={() => {
            logout()
            navigate('/')
          }}
          style={{
            padding: '10px 16px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Logout
        </button>
      </div>

      {/* STATS CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <h3>Total Orders</h3>
          <div style={{ fontSize: 32, fontWeight: 700 }}>
            {totalOrders}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3>Completed Orders</h3>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#4caf50' }}>
            {completedOrders}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3>Revenue</h3>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ec4899' }}>
            ₹{revenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* WEEKLY ORDERS */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <h3 style={{ marginBottom: 20 }}>Weekly Orders</h3>
        <Bar
          data={barData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true },
              x: { grid: { display: false } }
            }
          }}
        />
      </div>

      {/* ORDER STATUS */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <h3 style={{ marginBottom: 20 }}>Order Status</h3>

        <div style={{ height: 300, position: 'relative' }}>
          <Doughnut data={donutData} options={donutOptions} />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              {totalOrders}
            </div>
            <div style={{ fontSize: 14, color: '#777' }}>
              Total Orders
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginTop: 20,
            paddingTop: 20,
            borderTop: '1px solid #f3f3f3'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4caf50' }}>
              {totalOrders > 0
                ? ((completedOrders / totalOrders) * 100).toFixed(1)
                : 0}
              %
            </div>
            <div style={{ fontSize: 14, color: '#777' }}>
              Completion Rate
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ff9800' }}>
              {pendingOrders}
            </div>
            <div style={{ fontSize: 14, color: '#777' }}>
              Orders Pending
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
