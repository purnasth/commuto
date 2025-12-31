import { getNow } from '../../src/utils/date.util';

describe('getNow', () => {
  it('should return a Date object', () => {
    expect(getNow()).toBeInstanceOf(Date);
  });
});
