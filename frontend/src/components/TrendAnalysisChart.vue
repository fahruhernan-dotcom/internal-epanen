<template>
  <div class="trend-chart-container">
    <Line v-if="chartData.labels.length" :data="chartData" :options="chartOptions" />
    <div v-else class="flex items-center justify-center py-2xl text-muted">
      <div class="mini-spinner-sage mb-sm"></div>
      <p>Mengkonsolidasi tren tahunan...</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const chartData = computed(() => {
  const datasets = []
  const companyColors = {
    'Lyori': { border: '#10b981', background: 'rgba(16, 185, 129, 0.1)' },
    'Kaja': { border: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' },
    'Moafarm': { border: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' },
    'ePanen': { border: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' },
    'Melon': { border: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)' }
  }

  const labels = props.data.labels || []
  
  Object.keys(props.data.companies || {}).forEach((companyName, index) => {
    let color = companyColors[companyName]
    
    // Fallback dynamic color if not in map
    if (!color) {
      const fallbacks = [
        { border: '#ec4899', background: 'rgba(236, 72, 153, 0.1)' },
        { border: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' },
        { border: '#84cc16', background: 'rgba(132, 204, 22, 0.1)' }
      ]
      color = fallbacks[index % fallbacks.length]
    }

    datasets.push({
      label: companyName,
      data: props.data.companies[companyName],
      borderColor: color.border,
      backgroundColor: color.background,
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 3
    })
  })

  return { labels, datasets }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false // We will handle custom legend in parent or just keep it clean
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: 'rgba(255, 255, 255, 0.5)',
      titleFont: { family: 'Inter', size: 10, weight: '700' },
      bodyColor: '#fff',
      bodyFont: { family: 'Inter', size: 13, weight: '800' },
      borderColor: 'rgba(16, 185, 129, 0.2)',
      borderWidth: 1,
      padding: 16,
      cornerRadius: 16,
      displayColors: true,
      boxPadding: 8,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#64748b',
        font: { family: 'Inter', size: 11, weight: '700' }
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.03)',
        drawBorder: false
      },
      ticks: {
        color: '#64748b',
        font: { family: 'Inter', size: 11, weight: '700' },
        callback: function(value) {
          if (value === 0) return 'Rp 0';
          const absVal = Math.abs(value);
          let label = '';
          if (absVal >= 1000000) label = (value / 1000000).toFixed(1) + 'jt';
          else if (absVal >= 1000) label = (value / 1000).toFixed(0) + 'rb';
          else label = value;
          return 'Rp ' + label;
        }
      }
    }
  }
}
</script>

<style scoped>
.trend-chart-container {
  height: 350px;
  width: 100%;
}
</style>
