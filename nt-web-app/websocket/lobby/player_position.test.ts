import { NT } from '../messages';
import { decode, encode, encodeListItem } from '../messageHandler';
import { PlayerPositions } from './player_positions';

describe('PlayerPosition', () => {
  it('end to end test', () => {
    jest.useFakeTimers();

    const move = (userId: string, n: number): NT.IEnvelope => ({
      gameAction: { sPlayerMove: { userId, frames: [{ x: n, y: n }] } },
    });

    const cb = jest.fn();
    const pp = new PlayerPositions();

    pp.start(buf => cb(NT.Envelope.toObject(decode(buf))), 100);

    pp.push('1', move('1', 1));
    pp.push('2', move('2', 2));
    // new update from same player id replaces old one
    pp.push('1', move('1', 3));

    // no messages until time has passed
    jest.advanceTimersByTime(99);
    expect(cb).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({
      isMultiple: true,
      list: [move('1', 3), move('2', 2)],
    });

    jest.advanceTimersByTime(100);
    // no updates = no messages sent
    expect(cb).toHaveBeenCalledTimes(1);

    pp.push('2', move('2', 4));

    jest.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalledTimes(2);

    // old data is not sent; array indexes are
    // correctly cleared
    expect(cb).toHaveBeenCalledWith({
      isMultiple: true,
      list: [move('2', 4)],
    });

    jest.useRealTimers();
  });
  it('proto concatenation works', () => {
    const msg1: NT.IEnvelope = {
      gameAction: {
        sChat: {
          id: '1',
          userId: '123',
          name: 'bar',
          message: 'foo',
        },
      },
    };
    const msg2: NT.IEnvelope = {
      gameAction: {
        sChat: {
          id: '1',
          userId: '123',
          name: 'bar',
          message: 'foo',
        },
      },
    };

    const messageHeader = encode({ isMultiple: true });
    expect(messageHeader).toBeDefined();

    const env1 = encodeListItem(msg1);
    expect(env1).toBeDefined();

    const env2 = encodeListItem(msg1);
    expect(env2).toBeDefined();

    const serializedActual = Buffer.concat([messageHeader!, env1!, env2!]);
    const expected: NT.IEnvelope = {
      isMultiple: true,
      list: [msg1, msg2],
    };

    const serializedExpected = encode(expected);
    expect(serializedExpected).toEqual(serializedActual);

    const decoded = decode(serializedActual);
    const error = NT.Envelope.verify(decoded);
    expect(error).toBeNull();

    expect(NT.Envelope.toObject(decoded).list).toEqual([msg1, msg2]);
  });
});
