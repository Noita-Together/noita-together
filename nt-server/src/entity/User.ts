import {Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn} from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    display_name: string

    @Column()
    access: Role

    @CreateDateColumn()
    user_since?: string

    @UpdateDateColumn()
    updated_at?: string

    constructor(id: string, twitch_user_name: string, access: Role) {
        this.access = access
        this.display_name = twitch_user_name
        this.id = id
    }
}

export interface Role {
    canCreateRooms?: boolean
    canJoinRooms?: boolean
    canChat?: boolean
    canPlay?: boolean
    canWatchStats?: boolean
    canListLobbies?: boolean
    /**
     * Can the user create larger rooms?
     */
    elevatedRoomPermissions?: boolean
    isModerator?: boolean
}

export class RoleImpl implements Role {
    canChat: boolean;
    canCreateRooms: boolean;
    canJoinRooms: boolean;
    canPlay: boolean;
    canWatchStats: boolean;
    elevatedRoomPermissions: boolean;
    canListLobbies: boolean;
    isModerator: boolean;

    constructor(
        opts = {} as Role
    ) {
        this.canChat = opts.canChat ?? false
        this.canCreateRooms = opts.canCreateRooms ?? false
        this.canJoinRooms = opts.canJoinRooms ?? false
        this.canPlay = opts.canPlay ?? false
        this.canWatchStats = opts.canWatchStats ?? false
        this.elevatedRoomPermissions = opts.elevatedRoomPermissions ?? false
        this.isModerator = opts.isModerator ?? false
        this.canListLobbies = opts.canListLobbies ?? false
    }
}

export const defaultRoles = {
    canChat: true,
    canCreateRooms: true,
    canJoinRooms: true,
    canPlay: true,
    canWatchStats: true,
    canListLobbies: true,
    elevatedRoomPermissions: false,
    isModerator: false
} as Role