<template>
  <component :is="iconComponent" :size="size" :class="className" v-bind="$attrs" />
</template>

<script setup>
import { computed } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 20
  },
  className: {
    type: String,
    default: ''
  }
})

const iconComponent = computed(() => {
  if (!props.name) return LucideIcons.HelpCircle

  // Handle kebab-case and convert to PascalCase
  const pascalCase = props.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  // Try to get the icon from Lucide
  if (LucideIcons[pascalCase]) {
    return LucideIcons[pascalCase]
  }

  // Fallback for emoji-style names
  const emojiMap = {
    'dashboard': 'LayoutDashboard',
    'bar-chart': 'BarChart3',
    'bar-chart-3': 'BarChart3',
    'line-chart': 'LineChart',
    'pie-chart': 'PieChart',
    'clipboard-list': 'ClipboardList',
    'reports': 'ClipboardList',
    'dollar-sign': 'DollarSign',
    'financial': 'DollarSign',
    'money': 'DollarSign',
    'brain': 'Brain',
    'ai': 'Brain',
    'search': 'Search',
    'query': 'Search',
    'trending-up': 'TrendingUp',
    'analytics': 'TrendingUp',
    'book-open': 'BookOpen',
    'sop': 'BookOpen',
    'reference': 'BookOpen',
    'users': 'Users',
    'admin': 'Users',
    'eye': 'Eye',
    'audit': 'Eye',
    'logs': 'FileText',
    'log-out': 'LogOut',
    'logout': 'LogOut',
    'sun': 'Sun',
    'light-mode': 'Sun',
    'moon': 'Moon',
    'dark-mode': 'Moon',
    'bell': 'Bell',
    'notification': 'Bell',
    'user': 'User',
    'profile': 'User',
    'pencil': 'Pencil',
    'edit': 'Pencil',
    'trash': 'Trash2',
    'trash-2': 'Trash2',
    'delete': 'Trash2',
    'lock': 'Lock',
    'locked': 'Lock',
    'unlock': 'Unlock',
    'unlocked': 'Unlock',
    'calendar': 'Calendar',
    'date': 'Calendar',
    'folder': 'Folder',
    'folder-open': 'FolderOpen',
    'cloud-rain': 'CloudRain',
    'rain': 'CloudRain',
    'cloud': 'Cloud',
    'thermometer': 'Thermometer',
    'temperature': 'Thermometer',
    'plus-circle': 'PlusCircle',
    'add': 'PlusCircle',
    'x': 'X',
    'close': 'X',
    'alert-triangle': 'AlertTriangle',
    'warning': 'AlertTriangle',
    'check-circle': 'CheckCircle',
    'success': 'CheckCircle',
    'alert-octagon': 'AlertOctagon',
    'error': 'AlertOctagon',
    'info': 'Info',
    'bot': 'Bot',
    'zap': 'Zap',
    'fast': 'Zap',
    'target': 'Target',
    'goal': 'Target',
    'trending-down': 'TrendingDown',
    'arrow-up': 'ArrowUp',
    'arrow-down': 'ArrowDown',
    'arrow-right': 'ArrowRight',
    'chevron-right': 'ChevronRight',
    'building': 'Building2',
    'building-2': 'Building2',
    'company': 'Building2',
    'leaf': 'Leaf',
    'sprout': 'Sprout',
    'apple': 'Apple',
    'circle-dot': 'CircleDot',
    'layout-dashboard': 'LayoutDashboard',
    'help-circle': 'HelpCircle',
    'home': 'Home',
    'settings': 'Settings',
    'menu': 'Menu',
    'more-vertical': 'MoreVertical',
    'more-horizontal': 'MoreHorizontal',
    'download': 'Download',
    'upload': 'Upload',
    'refresh-cw': 'RefreshCw',
    'refresh': 'RefreshCw',
    'filter': 'Filter',
    'sort-asc': 'ArrowUp',
    'sort-desc': 'ArrowDown',
    'maximize': 'Maximize',
    'minimize': 'Minimize',
    'external-link': 'ExternalLink',
    'file-text': 'FileText',
    'clipboard-list': 'ClipboardList',
    'rocket': 'Rocket',
    'check-circle-2': 'CheckCircle',
    'sparkles': 'Sparkles',
    'flame': 'Flame',
    'database': 'Database',
    'printer': 'Printer',
    'book': 'Book',
    'scale': 'Scale',
    'stethoscope': 'Stethoscope',
    'minus-circle': 'MinusCircle',
    'circle': 'Circle',
    'inbox': 'Inbox'
  }

  const mappedName = emojiMap[props.name.toLowerCase()] || pascalCase
  return LucideIcons[mappedName] || LucideIcons.HelpCircle
})
</script>

<style scoped>
/* Ensure icons inherit colors from parent */
svg {
  stroke: currentColor;
}
</style>
