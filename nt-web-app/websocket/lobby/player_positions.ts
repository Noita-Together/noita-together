import { encode } from '../messageHandler';

const DEFAULT_UPDATE_INTERVAL = 250;

const MULTIPLE_HEADER = (() => {
  const header = encode({ multiple: true });
  if (!header) throw new Error('Failed to encode MULTIPLE_HEADER');
  return header;
})();

export class PlayerPositions {
  private pending: Uint8Array[] = [MULTIPLE_HEADER];
  private playerIdx: Record<string, number> = {};
  private playerNoIdx: Record<string, number> = {};
  private timer: NodeJS.Timeout | undefined;

  /**
   * Push a position update for the given user to the queue
   *
   * @param userId ID of the user to whom this position belongs
   * @param encoded Encoded protobuf data, ready-to-send
   */
  push(userId: string, encoded: Uint8Array | undefined): void {
    if (!encoded) return;

    // TODO: game sends messages even when nothing has changed. we can avoid the
    // encoding overhead if we put a stop to that.
    var last = this.playerIdx[userId];
    if (last === undefined) {
      // haven't seen this user before, record them in the "reset" object
      last = this.playerNoIdx[userId] = -1;
    }
    if (last === -1) {
      this.playerIdx[userId] = this.pending.push(encoded) - 1;
    } else {
      this.pending[last] = encoded;
    }
  }

  /**
   * Start sending position updates
   *
   * @param broadcast Callback to receive a Uint8Array[] of position updates to send to users
   * @param interval Interval (in ms) to perform flushes
   */
  start(broadcast: (msg: Buffer) => void, interval: number = DEFAULT_UPDATE_INTERVAL): void {
    this.stop();

    this.timer = setInterval(() => {
      if (this.pending.length === 0) return;

      broadcast(Buffer.concat(this.pending));
      this.pending.length = 1;
      Object.assign(this.playerIdx, this.playerNoIdx);
    }, interval);
  }

  /**
   * Stop sending position updates
   */
  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
