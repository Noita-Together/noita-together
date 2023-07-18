import { DataSource } from "typeorm"
import {RoomStatsDatasource} from "../Datasource";
import StatsInterface from "./StatsInterface";
import {RoomStats, SessionStats, UserStats} from "../../entity/RunStatistics";

class StatsController implements StatsInterface{
    private pendingEvents: number = 0
    private runStatsDb: DataSource
    private constructor(runStatsDb: DataSource) {
        this.runStatsDb = runStatsDb
    }

    static async create(): Promise<StatsController>{
        const db = await RoomStatsDatasource()
        if(!db) throw new Error("createStatsController: Failed to init DB!")
        return new StatsController(db)
    }

    runEvent(event_name: string, callback: ()=>Promise<unknown>){
        this.pendingEvents++
        callback().catch((e)=>{
            console.error(e)
        }).then(_=>{
            this.pendingEvents--
        })
    }

    createRoom(owner_id: string, room_name: string, room_id: string): void {
        this.runEvent('create_room', async ()=>{
            const room = new RoomStats(room_name, owner_id, room_id)
            await room.save()
        })
    }

    async createSession(room_id: string): Promise<string> {
        const session = new SessionStats(room_id, false)
        await session.save()
        return session.session_id!!;
    }

    completeSession(session_id: string): void {
        this.runEvent('session_completed',async() => {
            const session = await this.runStatsDb.getRepository(SessionStats).findOneById(session_id)
            if(!session) return
            session.finished = true
            await session.save()
        })
    }

    addBigSteveKillToUser(session_id: string, user_id: string, x: number, y: number): void {
        this.runEvent('big_steve_kill',async() => {
            const repo = this.runStatsDb.getRepository(UserStats)
            let userStats = await repo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            if(!userStats){
                userStats = new UserStats(session_id, user_id)
            }
            userStats.big_steve_kills++
            await repo.save(userStats)
        })
    }

    addSteveKillToUser(session_id: string, user_id: string, x: number, y: number): void {
        this.runEvent('steve_kill',async() => {
            const repo = this.runStatsDb.getRepository(UserStats)
            let userStats = await repo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            if(!userStats){
                userStats = new UserStats(session_id, user_id)
            }
            userStats.steve_kills++
            await repo.save(userStats)
        })
    }

    addEnemyKill(session_id: string, user_id: string, enemy_name: string, x: number, y: number): void {
        this.runEvent('enemy_killed',async() => {

        })
    }

    addDeathToUser(session_id: string, user_id: string, kill_reason: string, x: number, y: number): void {
        this.runEvent('user_death',async() => {
            const repo = this.runStatsDb.getRepository(UserStats)
            let userStats = await repo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            if(!userStats){
                userStats = new UserStats(session_id, user_id)
            }
            userStats.deaths++
            await repo.save(userStats)
        })
    }

    addWinToUser(session_id: string, user_id: string, x: number, y: number): void {
        this.runEvent('user_win',async() => {
            const repo = this.runStatsDb.getRepository(UserStats)
            let userStats = await repo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            if(!userStats){
                userStats = new UserStats(session_id, user_id)
            }
            userStats.wins++
            await repo.save(userStats)
        })
    }

    addHeartToUser(session_id: string, user_id: string, x: number, y: number): void {
        this.runEvent('heart_pickup',async() => {
            const repo = this.runStatsDb.getRepository(UserStats)
            let userStats = await repo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            if(!userStats){
                userStats = new UserStats(session_id, user_id)
            }
            userStats.hearts++
            await repo.save(userStats)
        })
    }

    addOrbToUser(session_id: string, user_id: string, x: number, y: number): void {
        this.runEvent('orb_pickup',async() => {
            const repo = this.runStatsDb.getRepository(UserStats)
            let userStats = await repo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            if(!userStats){
                userStats = new UserStats(session_id, user_id)
            }
            userStats.orbs++
            await repo.save(userStats)
        })
    }
}

export {
    StatsController
}