import {Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm"
import * as crypto from "crypto";

@Entity()
export class PendingConnection {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    userCode: string

    @UpdateDateColumn()
    last_connected?: string

    constructor() {
        this.id = crypto.randomUUID()
        this.userCode = generateValidationCode()
    }
}

function generateValidationCode() {
    // Generate a random 4-byte (32-bit) number
    const randomBytes = crypto.randomBytes(4);
    const randomInt = randomBytes.readUInt32BE(0);

    // Convert the random number to a fixed-length string
    return String(randomInt).padStart(8, '0');
}