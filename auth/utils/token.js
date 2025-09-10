export function parseTokenExpToSeconds(exp) {
    if (!exp) return null
    if (/^\d+$/.test(String(exp))) return Number(exp)
    const m = String(exp).match(/^(\d+)([smhd])$/)
    if (!m) return null
    const n = Number(m[1])
    const u = m[2]
    switch (u) {
        case 's': return n
        case 'm': return n * 60
        case 'h': return n * 3600
        case 'd': return n * 86400
        default: return null
    }
}
