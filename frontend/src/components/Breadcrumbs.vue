<template>
  <nav class="breadcrumbs" v-if="crumbs.length > 1">
    <ol class="breadcrumb-list">
      <li v-for="(crumb, index) in crumbs" :key="index" class="breadcrumb-item">
        <router-link
          v-if="index < crumbs.length - 1 && crumb.to"
          :to="crumb.to"
          class="breadcrumb-link"
        >
          <AppIcon v-if="crumb.icon" :name="crumb.icon" :size="16" class="breadcrumb-icon" />
          <span>{{ crumb.label }}</span>
        </router-link>
        <span v-else class="breadcrumb-current">
          <AppIcon v-if="crumb.icon" :name="crumb.icon" :size="16" class="breadcrumb-icon" />
          <span>{{ crumb.label }}</span>
        </span>
        <span v-if="index < crumbs.length - 1" class="breadcrumb-separator">
          /
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'

const route = useRoute()

const crumbs = computed(() => {
  const pathArray = route.path.split('/').filter(p => p)

  // Build breadcrumb array
  const breadcrumbs = []
  let accumulatedPath = ''

  // Always add Dashboard as first item
  if (pathArray.length > 0) {
    breadcrumbs.push({
      label: 'Dashboard',
      to: '/',
      icon: 'layout-dashboard'
    })
  }

  // Add route segments
  pathArray.forEach((segment, index) => {
    accumulatedPath += `/${segment}`

    // Skip last segment (current page) - make it current, not link
    if (index < pathArray.length - 1) {
      breadcrumbs.push({
        label: formatLabel(segment),
        to: accumulatedPath,
        icon: getPageIcon(segment)
      })
    } else {
      // Current page
      breadcrumbs.push({
        label: formatLabel(segment),
        to: null, // No link for current page
        icon: getPageIcon(segment)
      })
    }
  })

  // If we're on dashboard root, just show Dashboard
  if (breadcrumbs.length === 0) {
    breadcrumbs.push({
      label: 'Dashboard',
      to: '/',
      icon: 'layout-dashboard'
    })
  }

  return breadcrumbs
})

function formatLabel(segment) {
  // Convert URL slugs to readable text
  return segment
    .split('-')
    .map(word => {
      // Acronyms stay uppercase
      if (word.length <= 3 && word === word.toUpperCase()) {
        return word
      }
      // Regular words capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function getPageIcon(segment) {
  // Map route segments to appropriate icons
  const iconMap = {
    'admin': 'users',
    'analytics': 'trending-up',
    'reports': 'clipboard-list',
    'financial-reports': 'dollar-sign',
    'ai-intelligence': 'brain',
    'query': 'search',
    'sop-reference': 'book-open',
    'logs': 'eye',
    'profile': 'user',
    'companies': 'building-2'
  }

  // Handle dynamic company IDs
  if (segment.match(/^[0-9a-f]{8}-/i)) {
    return 'building-2'
  }

  return iconMap[segment] || 'file-text'
}
</script>

<style scoped>
.breadcrumbs {
  margin-bottom: 0;
  padding: 0;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 8px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-dim);
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-decoration: none;
  transition: all 0.2s ease;
}

.breadcrumb-link:hover {
  color: var(--text-main);
}

.breadcrumb-current {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.breadcrumb-icon {
  display: none; /* Keep it clean without icons in crumbs */
}

.breadcrumb-separator {
  color: var(--glass-border);
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.6;
}
</style>
