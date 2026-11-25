import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPaginationMeta, escapeLike, parsePagination } from '../../src/utils/pagination.js';

describe('parsePagination', () => {
  it('uses defaults when nothing is sent', () => {
    assert.deepEqual(parsePagination({}), { page: 1, limit: 10, offset: 0 });
  });

  it('calculates the offset', () => {
    assert.deepEqual(parsePagination({ page: '3', limit: '20' }), { page: 3, limit: 20, offset: 40 });
  });

  it('caps the limit at 100', () => {
    assert.equal(parsePagination({ limit: '5000' }).limit, 100);
  });

  it('falls back on garbage input', () => {
    assert.deepEqual(parsePagination({ page: '-4', limit: 'abc' }), { page: 1, limit: 10, offset: 0 });
  });
});

describe('buildPaginationMeta', () => {
  it('describes the middle page', () => {
    assert.deepEqual(buildPaginationMeta(45, 2, 10), {
      page: 2,
      limit: 10,
      totalItems: 45,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('reports one page when there are no items', () => {
    assert.equal(buildPaginationMeta(0, 1, 10).totalPages, 1);
  });
});

describe('escapeLike', () => {
  it('escapes wildcard characters', () => {
    assert.equal(escapeLike('50%_off'), '50\\%\\_off');
  });
});
