const apiBase = (() => {
    const prefix = process.env.VUE_APP_LOBBY_SERVER_API_URL_BASE || 'http://localhost:4444/api'
    return prefix.endsWith('/') ? prefix : `${prefix}/`
})();

export type StatsRowValue = string | number

export interface Stats {
    id: string
    name: string
    headings: string[]
    rows: (StatsRowValue[])[]
}

const getStatsUrl = (id: string, sessionId: string) => {
    return `${apiBase}stats/${id}/${sessionId}`
}

export {
    getStatsUrl,
}