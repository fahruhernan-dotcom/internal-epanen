/**
 * Icon Mapping Utility
 * Maps emoji and common names to Lucide icon names
 */

export const ICON_MAP = {
  // Navigation & Layout
  '📊': 'bar-chart-3',
  'dashboard': 'layout-dashboard',
  'home': 'home',
  'layout': 'layout-dashboard',

  // Reports & Data
  '📋': 'clipboard-list',
  'reports': 'clipboard-list',
  'report': 'file-text',
  'data': 'database',
  'analytics': 'trending-up',
  'statistics': 'bar-chart-2',

  // Financial
  '💰': 'dollar-sign',
  'financial': 'dollar-sign',
  'money': 'dollar-sign',
  'revenue': 'trending-up',
  'expense': 'trending-down',
  'profit': 'pie-chart',

  // AI & Intelligence
  '🧠': 'brain',
  'ai': 'brain',
  'intelligence': 'brain',
  'orchestrator': 'git-branch',

  // Search & Query
  '🔍': 'search',
  'search': 'search',
  'query': 'search',
  'filter': 'filter',
  'find': 'search',

  // Trends & Growth
  '📈': 'trending-up',
  'trending-up': 'trending-up',
  'growth': 'trending-up',
  'increase': 'trending-up',
  '📉': 'trending-down',
  'trending-down': 'trending-down',
  'decrease': 'trending-down',

  // Documentation & Reference
  '📖': 'book-open',
  'book': 'book-open',
  'sop': 'book-open',
  'reference': 'bookmark',
  'docs': 'file-text',
  'documentation': 'files',

  // User Management
  '👥': 'users',
  'users': 'users',
  'admin': 'shield',
  'people': 'users',
  'person': 'user',
  'user': 'user',
  '👤': 'user',

  // Audit & Logs
  '🕵️': 'eye',
  'audit': 'eye',
  'logs': 'scroll-text',
  'log': 'file-text',
  'history': 'history',
  'activity': 'activity',

  // Authentication
  '🚪': 'log-out',
  'login': 'log-in',
  'logout': 'log-out',
  'signout': 'log-out',
  'signin': 'log-in',

  // Themes & Display
  '☀️': 'sun',
  'sun': 'sun',
  'light-mode': 'sun',
  '🌙': 'moon',
  'moon': 'moon',
  'dark-mode': 'moon',

  // Notifications
  '🔔': 'bell',
  'bell': 'bell',
  'notification': 'bell',
  'alert': 'bell-ring',
  'notifications': 'bell-dot',

  // Actions
  '✏️': 'pencil',
  'pencil': 'pencil',
  'edit': 'pencil',
  'modify': 'pencil',

  '🗑️': 'trash-2',
  'trash': 'trash-2',
  'delete': 'trash-2',
  'remove': 'x',
  'erase': 'trash-2',

  '➕': 'plus-circle',
  'plus': 'plus',
  'add': 'plus-circle',
  'create': 'plus-circle',
  'new': 'plus-circle',

  '✕': 'x',
  'close': 'x',
  'cancel': 'x',
  'clear': 'x',

  // Lock & Security
  '🔒': 'lock',
  'lock': 'lock',
  'locked': 'lock',
  'unlock': 'unlock',
  'unlocked': 'unlock',
  'secure': 'shield',

  // Date & Time
  '📅': 'calendar',
  'calendar': 'calendar',
  'date': 'calendar',
  'time': 'clock',
  'schedule': 'calendar-clock',

  // File & Folder
  '📁': 'folder',
  'folder': 'folder',
  'directory': 'folder',
  '📂': 'folder-open',
  'folder-open': 'folder-open',
  'file': 'file',
  'files': 'files',

  // Companies & Organizations
  '🏢': 'building-2',
  'building': 'building-2',
  'company': 'building-2',
  'organization': 'building-2',
  'office': 'building',

  // Nature & Farming (SmartFarm specific)
  '🌾': 'leaf',
  'wheat': 'leaf',
  'farm': 'leaf',
  'farming': 'sprout',

  '🌱': 'sprout',
  'sprout': 'sprout',
  'seedling': 'sprout',
  'growth': 'sprout',

  '🥬': 'leaf',
  'vegetable': 'leaf',
  'veggies': 'leaf',

  '🍏': 'apple',
  'fruit': 'apple',
  'apple': 'apple',

  '🍈': 'circle-dot',
  'melon': 'circle-dot',
  'circle': 'circle',

  // Weather & Environment
  '🌧️': 'cloud-rain',
  'rain': 'cloud-rain',
  'rainy': 'cloud-rain',
  'shower': 'cloud-rain',

  '☁️': 'cloud',
  'cloud': 'cloud',
  'cloudy': 'cloud',

  '☀️': 'sun',
  'sunny': 'sun',
  'clear': 'sun',

  '🌤️': 'cloud-sun',
  'partly-cloudy': 'cloud-sun',
  'partly-sunny': 'cloud-sun',

  '🌡️': 'thermometer',
  'temperature': 'thermometer',
  'temp': 'thermometer',
  'hot': 'thermometer-sun',
  'cold': 'thermometer-snowflake',

  // Status & Indicators
  '⚠️': 'alert-triangle',
  'warning': 'alert-triangle',
  'warn': 'alert-triangle',

  '✅': 'check-circle',
  'check': 'check-circle',
  'success': 'check-circle',
  'done': 'check-circle',
  'complete': 'check-circle',
  'verified': 'verified',

  '🚨': 'alert-octagon',
  'error': 'alert-octagon',
  'critical': 'alert-octagon',
  'danger': 'alert-octagon',

  'ℹ️': 'info',
  'information': 'info',
  'help': 'help-circle',

  // UI Elements
  'settings': 'settings',
  'config': 'settings',
  'preferences': 'settings',
  'option': 'sliders-horizontal',

  'menu': 'menu',
  'hamburger': 'menu',
  'nav': 'menu',

  'more': 'more-vertical',
  'more-vertical': 'more-vertical',
  'more-horizontal': 'more-horizontal',
  'dots': 'more-horizontal',

  'external': 'external-link',
  'external-link': 'external-link',
  'open': 'external-link',

  // Data & Charts
  'chart': 'bar-chart',
  'bar-chart': 'bar-chart',
  'line-chart': 'line-chart',
  'pie-chart': 'pie-chart',
  'area-chart': 'area-chart',

  // Transfer & Sync
  'download': 'download',
  'upload': 'upload',
  'sync': 'refresh-cw',
  'refresh': 'refresh-cw',
  'reload': 'refresh-cw',
  'update': 'refresh-cw',

  // Sorting & Ordering
  'sort': 'arrow-up-down',
  'sort-asc': 'arrow-up',
  'sort-desc': 'arrow-down',
  'ascending': 'arrow-up',
  'descending': 'arrow-down',

  // View & Display
  'maximize': 'maximize',
  'fullscreen': 'maximize',
  'minimize': 'minimize',
  'collapse': 'minimize',

  // Directions
  '⬆️': 'arrow-up',
  'arrow-up': 'arrow-up',
  'up': 'arrow-up',

  '⬇️': 'arrow-down',
  'arrow-down': 'arrow-down',
  'down': 'arrow-down',

  '⬅️': 'arrow-left',
  'arrow-left': 'arrow-left',
  'left': 'arrow-left',
  'back': 'arrow-left',

  '➡️': 'arrow-right',
  'arrow-right': 'arrow-right',
  'right': 'arrow-right',
  'next': 'arrow-right',
  'forward': 'arrow-right',

  // Navigation specific
  'chevron-right': 'chevron-right',
  'chevron-left': 'chevron-left',
  'chevron-up': 'chevron-up',
  'chevron-down': 'chevron-down',

  // AI & Tech
  '🤖': 'bot',
  'bot': 'bot',
  'robot': 'bot',
  'automation': 'bot',

  '⚡': 'zap',
  'zap': 'zap',
  'fast': 'zap',
  'quick': 'zap',
  'instant': 'zap',

  '🎯': 'target',
  'target': 'target',
  'goal': 'target',
  'objective': 'target',

  // Other useful icons
  'copy': 'copy',
  'paste': 'clipboard',
  'cut': 'scissors',

  'undo': 'undo',
  'redo': 'redo',

  'zoom-in': 'zoom-in',
  'zoom-out': 'zoom-out',
  'zoom': 'search',

  'link': 'link',
  'unlink': 'unlink',

  'star': 'star',
  'favorite': 'heart',
  'heart': 'heart',
  'like': 'thumbs-up',

  'print': 'printer',
  'share': 'share',
  'send': 'send',

  'save': 'save',
  'disk': 'save',
  'floppy': 'save',

  'printer': 'printer',
  'scanner': 'scan-line'
}

/**
 * Get Lucide icon name from emoji or common name
 * @param {string} emojiOrName - Emoji or common name
 * @returns {string} Lucide icon name
 */
export function getIconName(emojiOrName) {
  if (!emojiOrName) return 'help-circle'
  return ICON_MAP[emojiOrName] || emojiOrName
}

/**
 * Check if a name is an emoji
 * @param {string} name - Name to check
 * @returns {boolean} True if emoji
 */
export function isEmoji(name) {
  if (!name) return false
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]/u
  return emojiRegex.test(name)
}

/**
 * Get icon component props
 * @param {string} emojiOrName - Emoji or name
 * @param {Object} defaults - Default props
 * @returns {Object} Icon props
 */
export function getIconProps(emojiOrName, defaults = {}) {
  return {
    name: getIconName(emojiOrName),
    size: defaults.size || 20,
    className: defaults.className || ''
  }
}
