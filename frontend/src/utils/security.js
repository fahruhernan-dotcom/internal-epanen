import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses DOMPurify to strip dangerous tags and attributes.
 *
 * @param {string} dirty - The potentially unsafe HTML string.
 * @returns {string} - The sanitized HTML string.
 */
export function sanitizeHTML(dirty) {
    if (!dirty) return ''
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'code', 'pre', 'blockquote', 'hr', 'img'],
        ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'src', 'alt', 'width', 'height'],
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    })
}

/**
 * Sanitize plain text input — strip HTML tags entirely.
 * Use for inputs that should NEVER contain HTML (names, phone numbers, etc)
 *
 * @param {string} input - User input
 * @returns {string} - Clean text without HTML
 */
export function sanitizeInput(input) {
    if (!input) return ''
    return String(input)
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim()
}

/**
 * Validate phone number format (Indonesian)
 * @param {string} phone 
 * @returns {boolean}
 */
export function validatePhoneNumber(phone) {
    if (!phone) return false
    const cleaned = String(phone).replace(/\D/g, '')
    // Indonesian: 10-15 digits, starts with 0 or 62 or 8
    return /^(0|62|8)\d{8,14}$/.test(cleaned)
}

/**
 * Sanitize file names to prevent path traversal attacks
 * @param {string} fileName 
 * @returns {string}
 */
export function sanitizeFileName(fileName) {
    if (!fileName) return 'unnamed'
    return String(fileName)
        .replace(/[\/\\:*?"<>|]/g, '_') // Replace dangerous chars
        .replace(/\.\./g, '_') // Prevent directory traversal
        .slice(0, 255) // Limit length
}

/**
 * Mask sensitive data for logging (show first 3 and last 2 chars)
 * @param {string} value 
 * @returns {string}
 */
export function maskSensitiveData(value) {
    if (!value || value.length < 6) return '***'
    return value.slice(0, 3) + '•'.repeat(value.length - 5) + value.slice(-2)
}
