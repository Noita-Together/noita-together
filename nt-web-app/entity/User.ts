import {Entity, PrimaryColumn, Column, UpdateDateColumn, CreateDateColumn} from "typeorm"

export type LoginProvider = 'local'|'twitch'

@Entity({name: "user", database: process.env.DATABASE_NAME, synchronize: true})
export class User{
    @PrimaryColumn()
    id: string

    @Column()
    provider: string

    @Column()
    display_name: string

    private _access: Role|null = null;

    @Column({ type: "text", nullable: false })
    get access(): string {
        // Convert the Role object to a space-delimited string
        if (this._access) {
            return Object.entries(this._access)
                .filter(([_, value]) => value)
                .map(([key]) => key)
                .join(" ");
        }
        return '';
    }

    set access(value: string|null) {
        if(!value){
            this._access = new RoleImpl()
            return
        }
        // Convert the space-delimited string back to a Role object
        const role: Role = {};
        value.split(" ").forEach(key => {
            role[key] = true;
        });
        this._access = role;
    }

    @CreateDateColumn({ type: "timestamp without time zone" })
    user_since?: Date;

    @UpdateDateColumn({ type: "timestamp without time zone" })
    updated_at?: Date;

    uaccess?: number

    constructor(id: string, twitch_user_name: string, access: Role, provider: LoginProvider) {
        this._access = access
        this.display_name = twitch_user_name
        this.id = id
        this.provider = provider
        this.uaccess = 0
    }
}

export interface Role {
    [key: string]: boolean | undefined
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
    [key: string]: boolean | undefined;
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