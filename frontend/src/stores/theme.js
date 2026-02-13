import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
    // State
    const isDarkMode = ref(false)

    // Initialize from localStorage
    function initTheme() {
        const stored = localStorage.getItem('epanen_theme')
        if (stored) {
            isDarkMode.value = stored === 'dark'
        } else {
            // Check system preference
            isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        applyTheme()
    }

    // Toggle theme
    function toggleTheme() {
        isDarkMode.value = !isDarkMode.value
        localStorage.setItem('epanen_theme', isDarkMode.value ? 'dark' : 'light')
        applyTheme()
    }

    // Apply theme to document
    function applyTheme() {
        if (isDarkMode.value) {
            document.documentElement.classList.add('dark-mode')
        } else {
            document.documentElement.classList.remove('dark-mode')
        }
    }

    return {
        isDarkMode,
        initTheme,
        toggleTheme
    }
})
