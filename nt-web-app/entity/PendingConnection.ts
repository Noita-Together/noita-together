import {BaseEntity, Column, Entity, PrimaryColumn} from "typeorm"
import * as crypto from "crypto";
import {Socket} from "net";

@Entity({name: "pending-connection", synchronize: true})
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
    @Column()
    lastCheck: number = Date.now()

    constructor(socket?: Socket) {
        super()
        this.id = crypto.randomUUID()
        this.userCode = generateValidationCode()
        this.socket = socket
    }
}

function generateValidationCode() {
    // Generate a secure random buffer
    const buffer = crypto.randomBytes(4);

    // Convert the buffer to a 32-bit unsigned integer
    const randomInt = buffer.readUInt32BE(0);

    // Calculate the maximum value for the 8-digit code
    const maxCode = Math.pow(10, 8) - 1;

    // Limit the random number within the desired range
    const validationCode = randomInt % (maxCode + 1);

    return validationCode.toString().padStart(8, '0');
}