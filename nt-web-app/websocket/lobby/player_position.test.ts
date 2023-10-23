import { decode, encode } from '../messageHandler';
import { NT } from '../messages';

describe('Envelope concatenation', () => {
  it('passes', () => {
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

    const env1 = encode(msg1);
    expect(env1).toBeDefined();

    const env2 = encode(msg2);
    expect(env2).toBeDefined();

    const header = encode({
      multiple: true,
    });
    expect(header).toBeDefined();

    const buf = Buffer.concat([header!, env1!, env2!]);

    const decoded = decode(buf);
    const error = NT.Envelope.verify(decoded);
    expect(error).toBeNull();

    expect(decoded.multiple).toBe(true);
    expect(decoded.list).toEqual([msg1, msg2]);
  });
});
