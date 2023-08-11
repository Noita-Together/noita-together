/**
 * Here we will define a protocol for our stats controller in case we have multiple variants
 */
interface StatsInterface{
    /**
     * Creates the room and returns the room ID
     * @param room_name The name of the room
     * @param owner_id The owner ID
     * @param room_id the room ID
     */
    createRoom(owner_id: string, room_name: string, room_id: string): void

    /**
     * Creates a session for the room. Without this, we never will be able to save stats
     * @param room_id The room ID of a room
     * @returns session_id the session ID promise
     */
    createSession(room_id: string): Promise<string>
    completeSession(session_id: string): void

    addHeartToUser(session_id: string, user_id: string, x: number, y: number): void
    addOrbToUser(session_id: string, user_id: string, x: number, y: number): void
    addSteveKillToUser(session_id: string, user_id: string, x: number, y: number): void
    addBigSteveKillToUser(session_id: string, user_id: string, x: number, y: number): void
    addDeathToUser(session_id: string, user_id: string, kill_reason: string, x: number, y: number): void
    addWinToUser(session_id: string, user_id: string, x: number, y: number): void
    addEnemyKill(session_id: string, user_id: string, enemy_name: string, x: number, y: number): void
    setUser(user_id: string, display_name: string): void
}

export default StatsInterface