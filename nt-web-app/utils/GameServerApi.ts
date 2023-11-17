const apiBase = (() => {
    const prefix = process.env.VUE_APP_LOBBY_SERVER_WS_URL_BASE || `wss://${process.env.VUE_APP_HOSTNAME_WS}` || 'wss://noitatogether.com/ws/'
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
    return `${apiBase}${id}/${sessionId}`
}

export {
    getStatsUrl,
}