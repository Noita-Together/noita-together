import {BaseEntity, Column, Entity, PrimaryColumn, UpdateDateColumn} from "typeorm"
import * as crypto from "crypto";
import stream from "node:stream";
import WebSocket from "ws";
import {Duplex} from "stream";
import {Socket} from "net";

@Entity()
export class PendingConnection extends BaseEntity{
    @PrimaryColumn()
    id: string

    @Column()
    userCode: string

    @Column({nullable: true})
    resolvedUserId?: string
    @Column({nullable: true})
    resolvedProvider?: string

    socket?: Socket;

    lastCheck: number = Date.now()

    constructor(socket?: Socket) {
        super()
        this.id = crypto.randomUUID()
        this.userCode = generateValidationCode()
        this.socket = socket
    }
}

function generateValidationCode() {
    // Generate a random 4-byte (32-bit) number
    const randomBytes = crypto.randomBytes(4);
    const randomInt = randomBytes.readUInt32BE(0);

    // Convert the random number to a fixed-length string
    return String(randomInt).padStart(8, '0');
}