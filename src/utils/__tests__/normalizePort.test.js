/* global describe, test, expect */
import normalizePort from '../normalizePort';

describe('normalizePort(port)', () => {
  test(`should return a number when 'port' is a number`, () => {
    expect(normalizePort(3000)).toEqual(3000);
  });

  test(`should return a number when 'port' is string number`, () => {
    expect(normalizePort('3000')).toEqual(3000);
  });

  test(`should throw when 'port' is not a number`, () => {
    expect(() => normalizePort('abcdef').toThrow(/Bad port/));
  });
});
