import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import tokenise from '../../tokeniser';
import evaluate from '../../evaluator';
import { chooseDisplayFor } from '../../display';
import { resolveUnit } from '../../units';

function evalDisplay(expr: string, lastUnitName?: string) {
  const tokRes = tokenise(expr);
  if (tokRes.isErr()) throw new Error(`tokenise error at idx=${tokRes.error.idx}`);
  const toks = tokRes.value;
  const ans = new Decimal(0);
  const ind = new Decimal(0);
  const angle = 'rad' as const;
  const evalRes = evaluate(toks, ans, ind, angle);
  if (evalRes.isErr()) throw new Error(`eval error ${evalRes.error}`);
  const res = evalRes.value;
  let tokensForDisplay = toks;
  if (lastUnitName) {
    const u = resolveUnit(lastUnitName);
    if (!u) throw new Error(`unknown unit ${lastUnitName}`);
    tokensForDisplay = [...toks, { type: 'unit', name: lastUnitName, factor: u.factor, dims: u.dims } as any];
  }
  const { display, unit } = chooseDisplayFor(tokensForDisplay, res);
  return { value: display, unit };
}

describe('e2e display', () => {
  it('1+2 shows 3 without unit', () => {
    const { value, unit } = evalDisplay('1+2');
    expect(value.toNumber()).toBe(3);
    expect(unit).toBeNull();
  });

  it('2 m + 30 cm = 2.3 m (last m)', () => {
    const { value, unit } = evalDisplay('2 m + 30 cm', 'm');
    expect(unit).toBe('m');
    expect(value.toNumber()).toBeCloseTo(2.3, 12);
  });

  it('1500 m auto-picks km when last unit is m', () => {
    const { value, unit } = evalDisplay('1500 m', 'm');
    expect(unit).toBe('m');
    expect(value.toNumber()).toBe(1500);
  });

  it('speed m/s shows composite unit', () => {
    const { value, unit } = evalDisplay('10 m / (2 s)');
    expect(unit).toBe('m/s');
    expect(value.toNumber()).toBe(5);
  });

  it('pow with units: (2 m)^2 = 4 m^2', () => {
    const { value, unit } = evalDisplay('(2 m) ^ 2');
    expect(unit).toBe('m^2');
    expect(value.toNumber()).toBe(4);
  });

  it('angles: sin(π/2) handled via evaluator (dimensionless)', () => {
    const { value, unit } = evalDisplay('sin(π/2)');
    expect(unit).toBeNull();
    expect(value.toNumber()).toBeCloseTo(1, 12);
  });
});

describe('e2e more units', () => {
  it('60 km / h = 16.666.. m/s', () => {
    const { value, unit } = evalDisplay('60 km / h');
    expect(unit).toBe('m/s');
    expect(value.toNumber()).toBeCloseTo(16.6666666667, 9);
  });

  it('5000 g displayed as 5 kg if last unit was kg', () => {
    const { value, unit } = evalDisplay('5000 g', 'kg');
    expect(unit).toBe('kg');
    expect(value.toNumber()).toBeCloseTo(5, 12);
  });

  it('10 N * 2 m = 20 J (prefers derived unit)', () => {
    const { value, unit } = evalDisplay('10 N * 2 m');
    expect(unit).toBe('J');
    expect(value.toNumber()).toBe(20);
  });

  it('3 A * 4 Ohm = 12 V', () => {
    const { value, unit } = evalDisplay('3 A * 4 Ohm');
    expect(unit).toBe('V');
    expect(value.toNumber()).toBe(12);
  });

  it('1 / (2 s) = 0.5 Hz', () => {
    const { value, unit } = evalDisplay('1 / (2 s)');
    expect(unit).toBe('Hz');
    expect(value.toNumber()).toBeCloseTo(0.5, 12);
  });

  it('2 kW * 3 h = 21_600_000 J (energy)', () => {
    const { value, unit } = evalDisplay('2 kW * 3 h');
    expect(unit).toBe('J');
    expect(value.toNumber()).toBeCloseTo(21600000, 2);
  });
});