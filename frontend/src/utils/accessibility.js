/**
 * Accessibility Utilities
 * WCAG AA compliance helpers for SmartFarm Dashboard
 */

/**
 * Generate a unique ID for ARIA attributes
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * ARIA label generators for common UI patterns
 */
export const ariaLabels = {
  // Navigation
  dashboard: 'Dashboard overview',
  reports: 'Laporan harian dan monitoring',
  financial: 'Laporan keuangan dan monitoring keuangan',
  analytics: 'Analisis trend dan forecasting',
  ai: 'AI Orchestrator Intelligence',
  sop: 'Buku saku SOP dan referensi',
  admin: 'Manajemen user dan sistem',
  logs: 'Audit logs dan aktivitas sistem',

  // Actions
  add: 'Tambah item baru',
  edit: 'Edit item',
  delete: 'Hapus item',
  save: 'Simpan perubahan',
  cancel: 'Batalkan',
  close: 'Tutup',
  search: 'Cari data',
  filter: 'Filter data',
  refresh: 'Refresh data',
  download: 'Download data',
  upload: 'Upload file',
  print: 'Cetak halaman',

  // Status
  loading: 'Memuat data',
  success: 'Operasi berhasil',
  error: 'Terjadi kesalahan',
  warning: 'Peringatan',
  info: 'Informasi',

  // User
  profile: 'Profil pengguna',
  settings: 'Pengaturan',
  logout: 'Keluar dari sistem',
  login: 'Masuk ke sistem',

  // Data
  chart: 'Grafik data',
  table: 'Tabel data',
  card: 'Kartu informasi',
  list: 'Daftar item',
  detail: 'Detail informasi',

  // Companies (SmartFarm specific)
  lyori: 'Perusahaan pertanian Lyori',
  moafarm: 'Perusahaan peternakan Moafarm',
  kaja: 'Perusahaan pertanian Kaja',
  epanen: 'Platform pemanen ePanen',
  melon: 'Perusahaan pertanian Melon'
}

/**
 * Get ARIA label for common actions
 * @param {string} action - Action name
 * @param {string} context - Additional context
 * @returns {string} ARIA label
 */
export function getAriaLabel(action, context = '') {
  const baseLabel = ariaLabels[action] || action
  return context ? `${baseLabel} ${context}` : baseLabel
}

/**
 * Keyboard navigation shortcuts
 */
export const keyboardShortcuts = {
  // Global shortcuts
  search: 'CmdOrCtrl + K',
  help: 'CmdOrCtrl + /',
  save: 'CmdOrCtrl + S',
  refresh: 'CmdOrCtrl + R',
  logout: 'CmdOrCtrl + Shift + Q',

  // Navigation
  dashboard: 'Alt + D',
  reports: 'Alt + R',
  analytics: 'Alt + A',
  admin: 'Alt + Shift + A',

  // Actions
  new: 'Alt + N',
  edit: 'Alt + E',
  delete: 'Alt + D',
  search: 'CmdOrCtrl + K'
}

/**
 * Announce screen reader message
 * @param {string} message - Message to announce
 */
export function announceToScreenReader(message) {
  if (typeof window !== 'undefined') {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
}

/**
 * Check color contrast ratio
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {object} Contrast ratio and WCAG level
 */
export function checkContrast(foreground, background) {
  // Simplified contrast calculation
  const getLuminance = (hex) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return 0

    const [r, g, b] = rgb.map(val => {
      val = val / 255
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null
  }

  const lum1 = getLuminance(foreground)
  const lum2 = getLuminance(background)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  const ratio = (lighter + 0.05) / (darker + 0.05)

  return {
    ratio: ratio.toFixed(2),
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail'
  }
}

/**
 * Get colorblind-friendly color combination
 * @param {string} baseColor - Base color
 * @param {number} index - Index for variation
 * @returns {object} Color and pattern for colorblind users
 */
export function getColorblindFriendlyColor(baseColor, index = 0) {
  const patterns = ['solid', 'striped', 'dotted', 'checked']

  const colorMap = {
    green: ['#22c55e', '#16a34a', '#15803d', '#14532d'],
    blue: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
    red: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
    yellow: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
    purple: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6']
  }

  const colors = colorMap[baseColor] || colorMap.green

  return {
    color: colors[index % colors.length],
    pattern: patterns[index % patterns.length]
  }
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within a container (for modals)
   * @param {HTMLElement} container - Container element
   */
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  },

  /**
   * Restore focus to previous element
   * @param {HTMLElement} element - Element to focus
   */
  restoreFocus(element) {
    if (element) {
      element.focus()
    }
  }
}

/**
 * Skip link generator
 * @param {string} targetId - Target element ID
 * @param {string} label - Link label
 * @returns {string} HTML for skip link
 */
export function generateSkipLink(targetId, label = 'Skip to main content') {
  return `<a href="#${targetId}" class="skip-link" onclick="document.getElementById('${targetId}').focus()">${label}</a>`
}

/**
 * Screen reader only utility
 * Hides content visually but keeps it accessible to screen readers
 */
export const srOnly = {
  class: 'sr-only',
  style: `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  `
}

/**
 * Visible on focus utility
 * Shows element when focused (for skip links, etc.)
 */
export const visibleOnFocus = {
  class: 'visible-on-focus',
  style: `
    &:focus {
      position: static;
      width: auto;
      height: auto;
      padding: inherit;
      margin: inherit;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }
  `
}
