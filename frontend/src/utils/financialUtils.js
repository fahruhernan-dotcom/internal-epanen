/**
 * Financial Data Utilities
 * Shared logic for parsing currency, extracting data from text, and grouping RAG chunks.
 */

// Helper: Parse ID currency format vs Number
export function parseRefNumber(val) {
    if (typeof val === 'number') return val
    if (!val) return 0

    // Cleanup: remove Rp, spaces, percent, and parentheses
    let str = String(val).replace(/Rp|\s|%|#|[-()]/g, '').trim()
    if (!str) return 0

    // Logic: 
    // Indonesian format: 1.000.000,50 (dots are thousands, comma is decimal)
    // English format: 1,000,000.50 (commas are thousands, dot is decimal)

    const dots = (str.match(/\./g) || []).length
    const commas = (str.match(/,/g) || []).length

    if (dots > 0 && commas > 0) {
        // Both exist: usually 1.000,00 or 1,000.00
        if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
            // ID pattern: 1.000,00 -> remove dots, comma to dot
            str = str.replace(/\./g, '').replace(',', '.')
        } else {
            // EN pattern: 1,000.00 -> remove commas
            str = str.replace(/,/g, '')
        }
    } else if (dots > 0) {
        // Only dots: check if it looks like thousands (e.g. 1.000, 16.000.000)
        // If multiple dots, or one dot with 3 digits after it, treat as thousands
        const parts = str.split('.')
        if (dots > 1 || (dots === 1 && parts[parts.length - 1].length === 3)) {
            str = str.replace(/\./g, '')
        }
        // else: 1.5 -> keep it as 1.5 (decimal)
    } else if (commas > 0) {
        // Only commas: 1,000 or 1,5
        const parts = str.split(',')
        if (commas > 1 || (commas === 1 && parts[parts.length - 1].length === 3)) {
            str = str.replace(/,/g, '')
        } else {
            str = str.replace(',', '.')
        }
    }

    return parseFloat(str) || 0
}

// Helper: Extract financial data from text content (Fallback)
export function extractFinancialsFromText(text) {
    if (!text) return { revenue: 0, expenses: 0, netProfit: null }

    // Broad pattern for numbers
    const numPattern = `([\\d.,]+)`

    const parseValue = (patterns, sumAll = false) => {
        let values = []
        for (const p of patterns) {
            const regex = new RegExp(p.source.replace('NUM', numPattern), 'gi')
            const matches = text.matchAll(regex)
            for (const match of matches) {
                if (!match) continue
                // Clean the captured number string from trailing dots/commas
                let cleanNum = match[1].replace(/[.,]$/, '')
                // Basic heuristic: if it's a tiny number like 56.3 without context, it might be a %
                // But we'll let AI handle the heavy lifting.
                let val = parseRefNumber(cleanNum)

                // Multiplier is usually the next group
                const multiplierStr = (match[2] || '').trim().toLowerCase()

                if (multiplierStr.includes('juta') || multiplierStr.includes('jt') || multiplierStr === 'm') val *= 1000000
                if (multiplierStr.includes('milyar') || multiplierStr.includes('mn') || multiplierStr === 'b') val *= 1000000000
                if (multiplierStr === 'k' || multiplierStr === 'rb') val *= 1000

                if (val > 0) values.push(val)
            }
        }

        if (values.length === 0) return 0
        if (sumAll) return values.reduce((a, b) => a + b, 0)
        return Math.max(...values)
    }

    // Capture Revenue - updated context to avoid generic decimals
    const revRaw = parseValue([
        /(?:Total\s+)?(?:Revenue|Omzet|Pendapatan|Pemasukan)[\s\S]{0,25}?(?:Rp)?\s*NUM\s*([MmKk]|juta|milyar|jt|rb)?/i
    ])

    // 2. EXPENSES: Sum the major "Total Beban" lines
    const expRaw = parseValue([
        /Total\s+(?:Expenses|Pengeluaran|Biaya\s+Produksi|Beban)[\s\S]{0,25}?(?:Rp)?\s*\(?NUM\)?/i
    ], true)

    // 3. NET PROFIT: Search for explicit labels
    const netProfitRaw = parseValue([
        /(?:Laba\s+Bersih|Laba\s+Tahun\s+Berjalan|Laba\s+Sebelum\s+Pajak|Net\s+Profit|Net\s+Income)[\s\S]{0,25}?(?:Rp)?\s*\(?NUM\)?\s*([MmKk]|juta|milyar|jt|rb)?/i
    ])

    return { revenue: revRaw, expenses: expRaw, netProfit: netProfitRaw || null }
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
                metadata: { ...chunk.metadata },
                chunks: []
            }
        }

        const doc = grouped[key]

        // 1. Try Metadata from chunk
        let newRev = parseRefNumber(chunk.metadata?.revenue)
        let newExp = parseRefNumber(chunk.metadata?.expenses)
        let newNet = parseRefNumber(chunk.metadata?.netProfit)

        // 2. Fallback: Parse from Content if metadata is missing or partial
        if ((!newRev || !newExp) && chunk.content) {
            const extracted = extractFinancialsFromText(chunk.content)
            if (!newRev) newRev = extracted.revenue
            if (!newExp) newExp = extracted.expenses
            if (!newNet) newNet = extracted.netProfit
        }

        // Update if better (already existing in doc might be 0)
        let currentRev = parseRefNumber(doc.metadata.revenue)
        let currentExp = parseRefNumber(doc.metadata.expenses)
        let currentNet = parseRefNumber(doc.metadata.netProfit)

        if (!currentRev && newRev) doc.metadata.revenue = newRev
        if (!currentExp && newExp) doc.metadata.expenses = newExp
        if (!currentNet && newNet) doc.metadata.netProfit = newNet

        if (!grouped[key].content) grouped[key].content = ''
        grouped[key].content += chunk.content + '\n'
        grouped[key].chunks.push(chunk)
    })

    // Final Pass: If netProfit was found explicitly, and it differs from rev-exp, 
    // we can either trust it or keep it as metadata. 
    // For now, we'll keep it as metadata and let the UI handle the "Truth".
    return Object.values(grouped)
}
