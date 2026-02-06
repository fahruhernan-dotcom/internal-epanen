/**
 * Financial Data Utilities
 * Shared logic for parsing currency, extracting data from text, and grouping RAG chunks.
 */

// Helper: Parse ID currency format vs Number
export function parseRefNumber(val) {
    if (typeof val === 'number') return val
    if (!val) return 0
    // Remove "Rp", spaces, and non-numeric chars except . and ,
    let str = String(val).replace(/Rp|\s/g, '')

    // Check format: "1.000.000" (ID) vs "1,000,000" (US)
    // Assumption: reports are in ID format (dot = thousands, comma = decimal)
    if (str.includes('.') && !str.includes(',')) {
        // e.g. "1.000.000" -> "1000000"
        return parseFloat(str.replace(/\./g, ''))
    }

    if (str.includes('.') && str.includes(',')) {
        // e.g. "1.000.000,50" -> "1000000.50"
        return parseFloat(str.replace(/\./g, '').replace(',', '.'))
    }

    // Fallback cleanup
    return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0
}

// Helper: Extract financial data from text content (Fallback)
export function extractFinancialsFromText(text) {
    if (!text) return { revenue: 0, expenses: 0 }

    const parseValue = (patterns) => {
        for (const regex of patterns) {
            const match = text.match(regex)
            if (match) {
                let cleanStr = match[1]
                const multiplierStr = (match[2] || match[3] || '').trim().toLowerCase()

                // --- Smart Number Parsing ---

                // Case 1: English-style decimals with suffix "M"/"K" often use dot as decimal "7.91M"
                // Heuristic: If it has a dot, and that dot is followed by 1 or 2 digits ONLY (at end), treat as decimal.
                // e.g. "7.91" -> Decimal. "7.910" -> Thousands.
                const decimalLookalike = /\.(\d{1,2})$/.test(cleanStr)

                if (decimalLookalike) {
                    // "7.91" -> "7.91" (keep dot)
                    // If mixed "1,000.50" -> "1000.50"
                    cleanStr = cleanStr.replace(/,/g, '')
                } else {
                    // Standard ID format: "11.200.000" -> remove dots
                    // "11,2" -> replace comma with dot
                    if (cleanStr.includes('.') && !cleanStr.includes(',')) {
                        cleanStr = cleanStr.replace(/\./g, '')
                    } else if (cleanStr.includes(',')) {
                        cleanStr = cleanStr.replace(/\./g, '').replace(',', '.')
                    }
                }

                let val = parseFloat(cleanStr)

                // --- Multiplier Handling ---
                if (multiplierStr.includes('juta') || multiplierStr.includes('jt') || multiplierStr === 'm') val *= 1000000
                if (multiplierStr.includes('milyar') || multiplierStr.includes('mn') || multiplierStr === 'b') val *= 1000000000
                if (multiplierStr === 'k' || multiplierStr === 'rb') val *= 1000

                if (val > 0) return val
            }
        }
        return 0
    }

    // Patterns for REVENUE
    const revRaw = parseValue([
        // "Revenue: Rp 11,2 juta" or "Rp 7.91M"
        /(?:Revenue|Omzet|Pendapatan|Pemasukan)[\s\S]{0,20}Rp\s*([\d.,]+)\s*([MmKk]|juta|milyar|jt|rb)?/i,
        // "Total Revenue ... 11.200.000" (Table format)
        /(?:Total\s+Revenue|Total\s+Pendapatan|Total\s+Omzet)[\s\S]{0,30}?([\d.,]+)\s*([MmKk]|juta|milyar|jt|rb)?/i
    ])

    // Patterns for EXPENSES
    const expRaw = parseValue([
        // "Costs: Rp 7.91M"
        /(?:Expenses|Pengeluaran|Biaya\s+Produksi)[\s\S]{0,20}Rp\s*([\d.,]+)\s*([MmKk]|juta|milyar|jt|rb)?/i,
        // "Total Costs ... 7.910.000"
        // "Total Biaya ... 7.91M"
        /(?:Total\s+Costs|Total\s+Biaya|Total\s+Pengeluaran)[\s\S]{0,30}?([\d.,]+)\s*([MmKk]|juta|milyar|jt|rb)?/i
    ])

    return { revenue: revRaw, expenses: expRaw }
}

// Helper: Group RAG chunks into logical documents
export function groupChunksToDocuments(rawChunks) {
    const grouped = {}

    rawChunks.forEach(chunk => {
        const title = chunk.metadata?.title || 'Untitled'
        const date = chunk.metadata?.date || chunk.created_at
        const company = chunk._company

        const dateStr = new Date(date).toISOString().split('T')[0]
        const key = `${company}_${dateStr}_${title}`.trim()

        if (!grouped[key]) {
            grouped[key] = {
                id: chunk.id,
                _company: company,
                created_at: chunk.created_at,
                metadata: { ...chunk.metadata }, // Start with first chunk's metadata
                chunks: []
            }
        }

        // Merge Logic: If this new chunk has better metadata, overwrite!
        const doc = grouped[key]
        let currentRev = parseRefNumber(doc.metadata.revenue)
        let currentExp = parseRefNumber(doc.metadata.expenses)

        // 1. Try Metadata from chunk
        let newRev = parseRefNumber(chunk.metadata?.revenue)
        let newExp = parseRefNumber(chunk.metadata?.expenses)

        // 2. Fallback: Parse from Content if metadata is missing
        if (!newRev && !newExp && chunk.content) {
            const extracted = extractFinancialsFromText(chunk.content)
            newRev = extracted.revenue
            newExp = extracted.expenses
        }

        // Update if better
        if (!currentRev && newRev) doc.metadata.revenue = newRev
        if (!currentExp && newExp) doc.metadata.expenses = newExp

        grouped[key].chunks.push(chunk)
    })

    return Object.values(grouped)
}
