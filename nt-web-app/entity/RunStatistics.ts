import {Entity, PrimaryColumn, Column, UpdateDateColumn, CreateDateColumn, PrimaryGeneratedColumn, Generated, BaseEntity} from "typeorm"

class BaseSessionStatsChild{
    @PrimaryColumn()
    id: string

    @Column()
    session_id: string

    @Column()
    user_id: string

    constructor(id: string, session_id: string, user_id: string) {
        this.id = id
        this.session_id = session_id
        this.user_id = user_id
    }
}

@Entity()
export class RoomStats extends BaseEntity{
    @PrimaryColumn()
    room_id: string

    @Column()
    room_owner_id: string

    @Column()
    room_name: string

    @CreateDateColumn({type: "datetime"})
    created_at?: Date;

    @UpdateDateColumn({type: "datetime"})
    updated_at?: Date;

    constructor(
        room_name: string,
        room_owner_id: string,
        room_id: string
    ) {
        super()
        this.room_name = room_name
        this.room_owner_id = room_owner_id
        this.room_id = room_id
    }
}

@Entity()
export class SessionStats extends BaseEntity{
    @PrimaryGeneratedColumn("uuid")
    session_id?: string

    @Column()
    room_id: string

    @Column()
    finished: boolean

    @CreateDateColumn({type: "datetime"})
    created_at?: Date;

    @UpdateDateColumn({type: "datetime"})
    updated_at?: Date;

    constructor(
        room_id: string,
        finished: boolean
    ) {
        super()
        this.room_id = room_id
        this.finished = finished
    }
}

@Entity()
export class UserStats extends BaseSessionStatsChild{
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
    steve_kills: number

    @Column()
    big_steve_kills: number

    @CreateDateColumn({type: "datetime"})
    created_at?: Date;

    @UpdateDateColumn({type: "datetime"})
    updated_at?: Date;

    constructor(
        session_id: string,
        user_id: string,
        allowed_rejoin_if_active_run: boolean = true,
        hearts: number = 0,
        orbs: number = 0,
        steve_kills: number = 0,
        big_steve_kills: number = 0,
        wins: number = 0,
        deaths: number = 0,
    ) {
        super(`${session_id}-${user_id}`, user_id, session_id)
        this.wins = wins
        this.steve_kills = steve_kills
        this.big_steve_kills = big_steve_kills
        this.hearts = hearts
        this.orbs = orbs
        this.deaths = deaths
        this.allowed_rejoin_if_active_run = allowed_rejoin_if_active_run
    }
}

@Entity()
export class EnemyKillCount extends BaseSessionStatsChild{

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


