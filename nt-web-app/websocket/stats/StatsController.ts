import { QueryRunner, Repository } from "typeorm"
import {RoomStatsDatasource} from "../Datasource";
import StatsInterface from "./StatsInterface";
import {RoomStats, SessionStats, UserStats} from "../../entity/RunStatistics";

class StatsController implements StatsInterface{
    private statsQueue: (()=>Promise<unknown>)[] = []
    private statsQueueProcessing = false
    private runStatsDb: QueryRunner
    private sessionStatsRepo: Repository<SessionStats>
    private roomStatsRepo: Repository<RoomStats>
    private userStatsRepo: Repository<UserStats>
    private userPool: {[key: string]:string} = {}

    private constructor(runStatsDb: QueryRunner) {
        this.runStatsDb = runStatsDb
        this.sessionStatsRepo = runStatsDb.manager.getRepository(SessionStats)
        this.roomStatsRepo = runStatsDb.manager.getRepository(RoomStats)
        this.userStatsRepo = runStatsDb.manager.getRepository(UserStats)
    }

    setUser(user_id: string, display_name: string): void {
        this.userPool[user_id] = display_name
    }

    static async create(): Promise<StatsController>{
        const db = await RoomStatsDatasource()
        if(!db) throw new Error("createStatsController: Failed to init DB!")
        const queryRunner = db.createQueryRunner()
        await queryRunner.connect()
        return new StatsController(queryRunner)
    }

    wait100executor = (resolve: (value: unknown) => void, reject: (reason?: any) => void)=>setTimeout(resolve, 100)

    async processEvents(){
        this.statsQueueProcessing = true
        while (this.statsQueue.length > 0){
            await this.statsHandler()
            // await new Promise(this.wait100executor)
        }
        this.statsQueueProcessing = false
    }

    async statsHandler(){
        const item = this.statsQueue.shift()

        if(!item) return
        try {
            await item()
        } catch (e) {
            console.error(e)
        }
    }

    runEvent(event_name: string, callback: ()=>Promise<unknown>){
        console.log(event_name)
        this.statsQueue.push(callback)
        if(!this.statsQueueProcessing) this.processEvents()
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

    completeSession(session_id: string|undefined): void {
        if(!session_id) return
        this.runEvent('session_completed',async() => {
            const session = await this.sessionStatsRepo.findOneById(session_id)
            if(!session) return
            session.finished = true
            await session.save()
        })
    }

    addBigSteveKillToUser(session_id: string, user_id: string, x: number, y: number): void {
        if(!session_id) return
        this.runEvent('big_steve_kill',async() => {
            let userStats = await this.userStatsRepo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            if(!userStats){
                userStats = new UserStats(session_id, user_id, this.userPool[user_id])
            }
            userStats.big_steve_kills++
            await this.userStatsRepo.save(userStats)
        })
    }

    addSteveKillToUser(session_id: string|undefined, user_id: string, x: number, y: number): void {
        if(!session_id) return
        this.runEvent('steve_kill',async() => {
            const repo = this.userStatsRepo
            let userStats = await repo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            if(!userStats){
                userStats = new UserStats(session_id, user_id, this.userPool[user_id])
            }
            userStats.steve_kills++
            await repo.save(userStats)
        })
    }

    addEnemyKill(session_id: string|undefined, user_id: string, enemy_name: string, x: number, y: number): void {
        if(!session_id) return
        this.runEvent('enemy_killed',async() => {

        })
    }

    addDeathToUser(session_id: string|undefined, user_id: string, kill_reason: string, x: number, y: number): void {
        if(!session_id) return
        this.runEvent('user_death',async() => {
            const repo = this.userStatsRepo
            let userStats = await repo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            if(!userStats){
                userStats = new UserStats(session_id, user_id, this.userPool[user_id])
            }
            userStats.deaths++
            await repo.save(userStats)
        })
    }

    addWinToUser(session_id: string|undefined, user_id: string, x: number, y: number): void {
        if(!session_id) return
        this.runEvent('user_win',async() => {
            const repo = this.userStatsRepo
            let userStats = await repo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            if(!userStats){
                userStats = new UserStats(session_id, user_id, this.userPool[user_id])
            }
            userStats.wins++
            await repo.save(userStats)
        })
    }

    addHeartToUser(session_id: string|undefined, user_id: string, x: number, y: number): void {
        if(!session_id) return
        this.runEvent('heart_pickup',async() => {
            const repo = this.userStatsRepo
            let userStats = await repo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            console.log(`Found an existing user? ${!!userStats}`)
            if(!userStats){
                userStats = new UserStats(session_id, user_id, this.userPool[user_id])
            }
            userStats.hearts++
            await repo.save(userStats)
        })
    }

    addOrbToUser(session_id: string|undefined, user_id: string, x: number, y: number): void {
        if(!session_id) return
        this.runEvent('orb_pickup',async() => {
            const repo = this.userStatsRepo
            let userStats = await repo.findOneBy({
                session_id: session_id,
                user_id: user_id
            })
            if(!userStats){
                userStats = new UserStats(session_id, user_id, this.userPool[user_id])
            }
            userStats.orbs++
            await repo.save(userStats)
        })
    }
}

export {
    StatsController
}