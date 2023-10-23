import { encode, encodeListItem } from '../messageHandler';
import { NT } from '../messages';

const DEFAULT_UPDATE_INTERVAL = 250;
const ENVELOPE_MESSAGE_HEADER = (() => {
  const header = encode({ isMultiple: true });
  if (!header) throw new Error("Can't create Envelope list header??");
  return header;
})();

export class PlayerPositions {
  private pending: Uint8Array[] = [ENVELOPE_MESSAGE_HEADER];
  private playerIdx: Record<string, number> = {};
  private playerNoIdx: Record<string, number> = {};
  private timer: NodeJS.Timeout | undefined;

  /**
   * Push a position update for the given user to the queue
   *
   * @param userId ID of the user to whom this position belongs
   * @param encoded Encoded protobuf data, ready-to-send
   */
  pushFrame(userId: string, frame: NT.IPlayerFrame): void {
    // TODO: game sends messages even when nothing has changed. we can avoid the
    // encoding overhead if we put a stop to that.

    // encodeListItem wraps the envelope into the repeated "list" field id so
    // that it can be concatenated after serialization
    var encoded = encodeListItem({ gameAction: { sPlayerMove: { userId, frames: [frame] } } });
    if (!encoded) return;

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
      if (this.pending.length <= 1) return;

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
