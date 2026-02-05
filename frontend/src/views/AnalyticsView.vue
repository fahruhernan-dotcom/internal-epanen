<template>
  <div class="analytics-page animate-fade-in">
    <header class="dashboard-header mb-lg">
      <span class="section-label">Business Intelligence</span>
      <h2 class="gradient-text">Trend & Forecasting Analytics</h2>
      <p class="text-muted">Analisis pertumbuhan performa jangka panjang untuk pengambilan keputusan strategis.</p>
    </header>

    <div class="analytics-grid">
      <!-- Main Chart -->
      <div class="card glass-premium chart-container col-span-2">
        <div class="card-header border-none">
          <h3>Growth Performance (Revenue vs Expenses)</h3>
          <div class="flex gap-sm">
            <select v-model="selectedYear" class="form-input btn-sm" @change="fetchFinancialData">
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
            </select>
          </div>
        </div>
        
        <div v-if="loading" class="chart-wrapper flex items-center justify-center">
          <div class="spinner"></div>
        </div>
        <div v-else class="chart-wrapper">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Small Stats Widgets -->
      <div class="card-nature glow-success stat-widget">
        <span class="section-label">Total Revenue</span>
        <div class="text-2xl font-bold text-neon-green">Rp {{ formatCurrency(totalStats.revenue) }}</div>
        <p class="text-tiny text-success mt-xs">Acumulated from all companies</p>
      </div>

      <div class="card-nature glow-info stat-widget">
        <span class="section-label">Net Profit</span>
        <div class="text-2xl font-bold text-neon-blue">Rp {{ formatCurrency(totalStats.profit) }}</div>
        <p class="text-tiny text-muted mt-xs">Average margin: {{ totalStats.margin }}%</p>
      </div>

      <!-- Comparative Analysis -->
      <div class="card glass-premium col-span-2">
        <div class="card-header border-none">
          <h3>Market Share & Distribution</h3>
        </div>
        <div class="flex flex-col md:flex-row gap-xl items-center">
          <div v-if="loading" class="pie-wrapper flex items-center justify-center">
             <div class="spinner"></div>
          </div>
          <div v-else class="pie-wrapper">
            <Pie :data="pieData" :options="pieOptions" />
          </div>
          <div class="table-container flex-1 no-border">
            <table class="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Revenue</th>
                  <th>Margin</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="comp in companyStats" :key="comp.name">
                  <td><strong>{{ comp.name }}</strong></td>
                  <td>Rp {{ formatCurrency(comp.revenue) }}</td>
                  <td>{{ comp.margin }}%</td>
                  <td :class="comp.profit > 0 ? 'text-success' : 'text-warning'">
                    {{ comp.profit > 0 ? 'Positive ↑' : 'Stable →' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase, VIEWS } from '@/services/supabase'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Pie } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const selectedYear = ref('2026')
const loading = ref(true)
const rawFinancialData = ref([])
const companyStats = ref([])

const totalStats = computed(() => {
  const rev = companyStats.value.reduce((acc, c) => acc + c.revenue, 0)
  const prof = companyStats.value.reduce((acc, c) => acc + c.profit, 0)
  const marg = rev > 0 ? ((prof / rev) * 100).toFixed(1) : 0
  return { revenue: rev, profit: prof, margin: marg }
})

const chartData = computed(() => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const revenueByMonth = new Array(12).fill(0)
  const expenseByMonth = new Array(12).fill(0)

  rawFinancialData.value.forEach(item => {
    const month = new Date(item.period_start).getMonth()
    revenueByMonth[month] += Number(item.revenue || 0)
    expenseByMonth[month] += Number(item.operational_expenses || 0) + Number(item.cogs || 0)
  })

  return {
    labels: months,
    datasets: [
      {
        label: 'Revenue',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: '#22c55e',
        data: revenueByMonth,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Expenses',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: '#ef4444',
        data: expenseByMonth,
        fill: true,
        tension: 0.4
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8' } }
  },
  scales: {
    y: {
      grid: { color: 'rgba(148, 163, 184, 0.1)' },
      ticks: { color: '#94a3b8' }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8' }
    }
  }
}

const pieData = computed(() => ({
  labels: companyStats.value.map(c => c.name),
  datasets: [
    {
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'],
      data: companyStats.value.map(c => c.revenue)
    }
  ]
}))

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#94a3b8' }
    }
  }
}

function formatCurrency(val) {
  if (!val) return '0'
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
  return val.toLocaleString('id-ID')
}

async function fetchFinancialData() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from(VIEWS.FINANCIAL_REPORTS)
      .select('*')
      .eq('year', parseInt(selectedYear.value))
    
    if (error) throw error
    rawFinancialData.value = data || []

    // Calculate company breakdown
    const breakdown = {}
    rawFinancialData.value.forEach(item => {
      const name = item.company_name
      if (!breakdown[name]) breakdown[name] = { name, revenue: 0, profit: 0 }
      breakdown[name].revenue += Number(item.revenue || 0)
      breakdown[name].profit += Number(item.net_profit || 0)
    })

    companyStats.value = Object.values(breakdown).map(c => ({
      ...c,
      margin: c.revenue > 0 ? ((c.profit / c.revenue) * 100).toFixed(1) : 0
    }))
  } catch (err) {
    console.error('Failed to fetch financial reports:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchFinancialData()
})
</script>

<style scoped>
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr) 250px;
  grid-template-rows: auto auto;
  gap: var(--space-lg);
}

.col-span-2 { grid-column: span 2; }

.chart-container {
  min-height: 450px;
  display: flex;
  flex-direction: column;
}

.chart-wrapper {
  flex: 1;
  min-height: 300px;
  margin-top: var(--space-lg);
}

.pie-wrapper {
  width: 250px;
  height: 250px;
}

.stat-widget {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.text-2xl { font-size: 1.75rem; }
.font-bold { font-weight: 700; }
.no-border { border: none; }
.border-none { border-bottom: none; }

@media (max-width: 1024px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  .col-span-2 { grid-column: span 1; }
  .pie-wrapper { width: 100%; }
}
</style>

