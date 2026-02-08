/**
 * Chart Configuration Utilities
 * ORDIXA-inspired chart settings untuk consistent data visualization
 */

/**
 * Format currency values for display
 * @param {number} val - Value to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(val) {
  if (!val || val === 0) return 'Rp 0'

  // Large values in millions
  if (val >= 1000000000) {
    return `Rp ${(val / 1000000000).toFixed(1)}M`
  }
  if (val >= 1000000) {
    return `Rp ${(val / 1000000).toFixed(1)}M`
  }
  if (val >= 1000) {
    return `Rp ${(val / 1000).toFixed(1)}K`
  }

  return `Rp ${val.toLocaleString('id-ID')}`
}

/**
 * Create rich tooltip data for charts
 * @param {Object} context - Chart.js context
 * @returns {Object} Tooltip data with value, change, and comparison
 */
export function createChartTooltip(context) {
  const dataIndex = context.dataIndex
  const dataset = context.dataset
  const value = dataset.data[dataIndex]
  const label = context.label

  // Calculate change from previous month
  const prevValue = dataset.data[dataIndex - 1]
  const change = prevValue ? ((value - prevValue) / prevValue * 100).toFixed(1) : 0

  return {
    label: label,
    value: formatCurrency(value),
    change: parseFloat(change),
    comparison: prevValue ? formatCurrency(prevValue) : null,
    isPositive: change >= 0
  }
}

/**
 * Default chart options (ORDIXA-style)
 */
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#94a3b8',
        usePointStyle: true,
        padding: 16,
        font: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        boxWidth: 8,
        boxHeight: 8
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#fff',
      bodyColor: '#e2e8f0',
      borderColor: 'rgba(34, 197, 94, 0.3)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      displayColors: true,
      usePointStyle: true,
      titleFont: {
        size: 13,
        weight: '500',
        family: "'Inter', sans-serif"
      },
      bodyFont: {
        size: 12,
        family: "'Inter', sans-serif"
      },
      callbacks: {
        label: function(context) {
          const data = createChartTooltip(context)
          let label = context.dataset.label || ''

          if (label) {
            label += ': '
          }
          label += data.value

          // Add comparison if available
          if (data.comparison !== null) {
            const changeIcon = data.isPositive ? '↑' : '↓'
            const changeColor = data.isPositive ? '#22c55e' : '#ef4444'
            label += `\nvs last month: ${changeIcon} ${Math.abs(data.change)}%`
          }

          return label
        },
        afterLabel: function(context) {
          const data = createChartTooltip(context)
          if (data.comparison !== null) {
            return `Previous: ${data.comparison}`
          }
          return ''
        }
      }
    }
  },
  scales: {
    y: {
      grid: {
        color: 'rgba(148, 163, 184, 0.08)',
        drawBorder: false
      },
      ticks: {
        color: '#94a3b8',
        font: {
          size: 11
        },
        padding: 8,
        callback: function(value) {
          return formatCurrency(value)
        }
      },
      border: {
        display: false
      }
    },
    x: {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        color: '#94a3b8',
        font: {
          size: 11
        },
        padding: 8
      },
      border: {
        display: false
      }
    }
  }
}

/**
 * Line chart specific options
 */
export const lineChartOptions = {
  ...defaultChartOptions,
  elements: {
    line: {
      tension: 0.4, // Smooth curves
      borderWidth: 2
    },
    point: {
      radius: 3,
      hoverRadius: 6,
      borderWidth: 2,
      hoverBorderWidth: 3
    }
  }
}

/**
 * Pie/Doughnut chart options
 */
export const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#94a3b8',
        usePointStyle: true,
        padding: 16,
        font: {
          size: 12,
          family: "'Inter', sans-serif"
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#fff',
      bodyColor: '#e2e8f0',
      borderColor: 'rgba(34, 197, 94, 0.3)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      callbacks: {
        label: function(context) {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)

          return `${label}: ${formatCurrency(value)} (${percentage}%)`
        }
      }
    }
  }
}

/**
 * Create gradient fill for line charts
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} color - Base color (hex)
 * @returns {CanvasGradient} Gradient fill
 */
export function createGradientFill(ctx, color) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, color + '40')  // 25% opacity
  gradient.addColorStop(1, color + '00')  // 0% opacity
  return gradient
}

/**
 * ORDIXA-style color palette for charts
 */
export const chartColors = {
  primary: '#22c55e',      // Green (main)
  primaryLight: '#86efac', // Light green
  primaryDark: '#16a34a',  // Dark green
  secondary: '#3b82f6',    // Blue
  danger: '#ef4444',       // Red
  warning: '#f59e0b',      // Amber
  purple: '#8b5cf6',       // Purple
  pink: '#ec4899',         // Pink
  cyan: '#06b6d4',         // Cyan
  orange: '#f97316',       // Orange
  teal: '#14b8a6'          // Teal
}

/**
 * Get chart color by index
 * @param {number} index - Color index
 * @returns {string} Color hex code
 */
export function getChartColor(index) {
  const colors = Object.values(chartColors)
  return colors[index % colors.length]
}

/**
 * Create dataset with ORDIXA-style styling
 * @param {Object} options - Dataset options
 * @returns {Object} Formatted dataset
 */
export function createDataset({
  label,
  data,
  color = chartColors.primary,
  fill = false,
  tension = 0.4
}) {
  return {
    label,
    data,
    backgroundColor: fill ? color + '30' : color,
    borderColor: color,
    borderWidth: 2,
    fill,
    tension,
    pointRadius: 3,
    pointHoverRadius: 6,
    pointBackgroundColor: color,
    pointBorderColor: '#fff',
    pointBorderWidth: 2
  }
}

/**
 * Month names for charts
 */
export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

/**
 * Quarter names for charts
 */
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

/**
 * Calculate percentage change
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
export function calculateChange(current, previous) {
  if (!previous || previous === 0) return 0
  return ((current - previous) / previous * 100).toFixed(1)
}
