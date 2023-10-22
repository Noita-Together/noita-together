import path from "path";
import fs from "fs";

export class StaticStatsPageGenerator{
    static GenerateHtmlStats(roomId: string, sessionId: string, stats: any){
        try {
            const baseDir = path.join(__dirname, `../../.storage/stats/${roomId}/${sessionId}/`)
            const templateHtml = path.join(__dirname, `../stats/template.html`)
            const templateUserHtml = path.join(__dirname, `../stats/template-segment-user.html`)
            if (!fs.existsSync(templateHtml) || !fs.existsSync(templateUserHtml)) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('Unable to locate template HTML file')
            }
            let fullHtml = fs.readFileSync(templateHtml, 'utf-8')
            const userHtmlSegment = fs.readFileSync(templateUserHtml, 'utf-8')
            if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, {recursive: true})
            const userData: any[] = []
            Object.values(stats.users).forEach((user: any) => {
                console.log(JSON.stringify(user))
                const data = userHtmlSegment.replace(/{([^{}]+)}/g, function (keyExpr, key) {
                    return user[key] !== undefined ? user[key] : `{${key}}`;
                });
                userData.push(data)
            })
            const replaceDataTemplate: {[key: string]: any} = {
                'INSERT_STATS_HERE': userData.join(''),
                'room-name': stats.roomName
            }
            fullHtml = fullHtml.replace(/{([^{}]+)}/g, function (keyExpr, key) {
                return replaceDataTemplate[key] !== undefined ? replaceDataTemplate[key] : `{${key}}`;
            });
            fs.writeFileSync(path.join(baseDir, 'stats-final.html'), fullHtml, 'utf-8')
            // TODO fs.writeFileSync(path.join(baseDir, 'stats-final.json'), JSON.stringify(userData, undefined, 2), 'utf-8')
        } catch (e) {
            console.error('failed to generate stats!')
            console.error(e)
            return false
        }
        return true
    }

    static DeleteHtmlStats(id: string){
        const baseDir = path.join(__dirname, `../../.storage/stats/${id}/`)
        try {
            if (fs.existsSync(baseDir)) {
                fs.rmSync(baseDir, {recursive: true})
            }
        } catch (e) {
            console.error(`Failed to delete html stats for room ${id}`)
            console.error(e)
        }
    }
}