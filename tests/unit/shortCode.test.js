import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateShortCode, isReservedCode, isValidCodeFormat } from '../../src/utils/shortCode.js';

describe('generateShortCode', () => {
  it('creates a 7 character code by default', () => {
    assert.equal(generateShortCode().length, 7);
  });

  it('only uses letters and numbers', () => {
    for (let i = 0; i < 200; i += 1) {
      assert.match(generateShortCode(), /^[A-Za-z0-9]{7}$/);
    }
  });

  it('respects a custom length', () => {
    assert.equal(generateShortCode(12).length, 12);
  });

  it('does not repeat in a small sample', () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateShortCode()));
    assert.equal(codes.size, 1000);
  });
});

describe('isValidCodeFormat', () => {
  it('accepts valid codes', () => {
    assert.equal(isValidCodeFormat('abc'), true);
    assert.equal(isValidCodeFormat('My-Link_01'), true);
  });

  it('rejects invalid codes', () => {
    assert.equal(isValidCodeFormat('ab'), false);
    assert.equal(isValidCodeFormat('has space'), false);
    assert.equal(isValidCodeFormat('favicon.ico'), false);
    assert.equal(isValidCodeFormat('a'.repeat(33)), false);
    assert.equal(isValidCodeFormat(undefined), false);
  });
});

describe('isReservedCode', () => {
  it('blocks codes that clash with routes, ignoring case', () => {
    assert.equal(isReservedCode('api'), true);
    assert.equal(isReservedCode('Admin'), true);
    assert.equal(isReservedCode('HEALTH'), true);
  });

  it('allows normal codes', () => {
    assert.equal(isReservedCode('summer-sale'), false);
  });
});
