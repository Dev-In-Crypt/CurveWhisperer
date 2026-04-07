import { describe, it, expect, beforeEach } from 'vitest';
import { AlertStore } from '../src/state/alert-store.js';
import { WhaleAlert, GraduationAlert } from '../src/utils/types.js';

function makeWhale(id: string, token = '0xaaa'): WhaleAlert {
  return {
    id,
    tokenAddress: token,
    tokenName: 'Test',
    alertType: 'large_buy',
    details: 'test',
    severity: 'medium',
    timestamp: Date.now(),
  };
}

function makeGrad(id: string, token = '0xbbb'): GraduationAlert {
  return {
    id,
    tokenAddress: token,
    name: 'GradToken',
    symbol: 'GT',
    timeToGraduate: '2h 30m',
    totalBnb: 18,
    uniqueBuyers: 50,
    topHolderPercent: 8,
    lastAiScore: 85,
    timestamp: Date.now(),
  };
}

describe('AlertStore', () => {
  let store: AlertStore;

  beforeEach(() => {
    store = new AlertStore();
  });

  it('adds and retrieves alerts', () => {
    store.addAlert(makeWhale('w1'));
    const recent = store.getRecent(10);
    expect(recent).toHaveLength(1);
    expect(recent[0].id).toBe('w1');
  });

  it('returns newest first', () => {
    store.addAlert(makeWhale('w1'));
    store.addAlert(makeWhale('w2'));
    store.addAlert(makeWhale('w3'));
    const recent = store.getRecent(10);
    expect(recent[0].id).toBe('w3');
    expect(recent[2].id).toBe('w1');
  });

  it('respects limit', () => {
    for (let i = 0; i < 10; i++) store.addAlert(makeWhale(`w${i}`));
    expect(store.getRecent(3)).toHaveLength(3);
  });

  it('filters by token', () => {
    store.addAlert(makeWhale('w1', '0xaaa'));
    store.addAlert(makeWhale('w2', '0xbbb'));
    store.addAlert(makeWhale('w3', '0xaaa'));

    const filtered = store.getByToken('0xaaa');
    expect(filtered).toHaveLength(2);
    expect(filtered.every(a => a.tokenAddress === '0xaaa')).toBe(true);
  });

  it('filters by type whale', () => {
    store.addAlert(makeWhale('w1'));
    store.addAlert(makeGrad('g1'));
    store.addAlert(makeWhale('w2'));

    const whales = store.getByType('whale');
    expect(whales).toHaveLength(2);
  });

  it('filters by type graduation', () => {
    store.addAlert(makeWhale('w1'));
    store.addAlert(makeGrad('g1'));

    const grads = store.getByType('graduation');
    expect(grads).toHaveLength(1);
  });

  it('counts graduations today', () => {
    store.addAlert(makeGrad('g1'));
    store.addAlert(makeGrad('g2'));
    store.addAlert(makeWhale('w1'));
    expect(store.graduationsToday).toBe(2);
  });

  it('caps at 200 alerts', () => {
    for (let i = 0; i < 250; i++) store.addAlert(makeWhale(`w${i}`));
    expect(store.getRecent(300)).toHaveLength(200);
  });
});
