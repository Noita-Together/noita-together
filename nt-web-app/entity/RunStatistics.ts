import {Entity, PrimaryColumn, Column, UpdateDateColumn, CreateDateColumn, PrimaryGeneratedColumn} from "typeorm"

class BaseRoomStatsChild{
    @PrimaryColumn()
    id: string

    @Column()
    room_id: string

    @Column()
    user_id: string

    constructor(id: string, room_id: string, user_id: string) {
        this.id = id
        this.room_id = room_id
        this.user_id = user_id
    }
}

@Entity()
export class RoomStats {
    @PrimaryColumn()
    id: string

    @Column()
    room_id: string

    @Column()
    room_owner: string

    @Column()
    room_owner_id: string

    @Column()
    room_name: string

    @Column()
    finished: boolean

    @CreateDateColumn({type: "datetime"})
    created_at?: Date;

    @UpdateDateColumn({type: "datetime"})
    updated_at?: Date;

    @Column()
    allow_rejoin: boolean

    @Column({type: "datetime"})
    expires_at: Date

    constructor(
        id: string,
        room_name: string,
        room_owner: string,
        room_owner_id: string,
        finished = false,
        allow_rejoin = true,
        expires_at = generateExpiration()
    ) {
        this.room_name = room_name
        this.id = id
        this.room_id = id
        this.room_owner = room_owner
        this.room_owner_id = room_owner_id
        this.finished = finished
        this.allow_rejoin = allow_rejoin
        this.expires_at = expires_at
    }
}

function generateExpiration(days= 7){
    const date = new Date()
    const timeMsToAdd = days*86400000
    return new Date(date.getDate()+timeMsToAdd)
}

@Entity()
export class UserStats extends BaseRoomStatsChild{
    @Column()
    wins: number

    @Column()
    hearts: number

    @Column()
    orbs: number

    @Column()
    deaths: number

    @Column()
    allowed_rejoin_if_active_run: boolean

    @Column()
    triggered_steve: boolean

    @CreateDateColumn({type: "datetime"})
    created_at?: Date;

    @UpdateDateColumn({type: "datetime"})
    updated_at?: Date;

    constructor(
        room_id: string,
        user_id: string,
        allowed_rejoin_if_active_run: boolean = true,
        hearts: number = 0,
        orbs: number = 0,
        triggered_steve: boolean = false,
        wins: number = 0,
        deaths: number = 0,
    ) {
        super(`${room_id}-${user_id}`, user_id, room_id)
        this.wins = wins
        this.triggered_steve = triggered_steve
        this.hearts = hearts
        this.orbs = orbs
        this.deaths = deaths
        this.allowed_rejoin_if_active_run = allowed_rejoin_if_active_run
    }
}

@Entity()
export class EnemyKillCount extends BaseRoomStatsChild{

    @Column()
    enemy_name: string

    @Column()
    enemy_id: string

    @Column()
    kills: number

    constructor(
        room_id: string,
        user_id: string,
        enemy_name: string,
        enemy_id: string,
        kills: number = 0
    ) {
        super(`${room_id}-${user_id}-enemy-kills`, user_id, room_id)
        this.enemy_name = enemy_name
        this.enemy_id = enemy_id
        this.kills = kills
    }
}

@Entity()
export class ItemPickupEvent{
    @PrimaryGeneratedColumn()
    id?: string

    @Column()
    room_id: string

    @Column()
    user_id: string

    @Column()
    item_name: string

    @Column()
    item_type: string

    @Column()
    x: number

    @Column()
    y: number

    @CreateDateColumn({type: "datetime"})
    time?: Date;

    constructor(
        room_id: string,
        user_id: string,
        item_name: string,
        item_type: string,
        x: number = 0,
        y: number = 0
    ) {
        this.room_id = room_id
        this.user_id = user_id
        this.item_name = item_name
        this.item_type = item_type
        this.x = x
        this.y = y
    }
}


