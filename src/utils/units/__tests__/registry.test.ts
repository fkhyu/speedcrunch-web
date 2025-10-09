import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { resolveUnit, UNITS, SI_PREFIXES, getUnit, pickAutoScaledUnit, getDisplayUnitAndFactor } from '../registry.ts';

describe('registry', () => {
  it('resolves exact units', () => {
    const m = resolveUnit('m');
    expect(m?.symbol).toBe('m');
    expect(m?.factor.eq(1)).toBe(true);
  });

  it('applies SI prefixes', () => {
    const mm = resolveUnit('mm');
    expect(mm).toBeTruthy();
    expect(mm?.factor.eq(UNITS.m.factor.mul(SI_PREFIXES.m))).toBe(true);

    const km = resolveUnit('km');
    expect(km?.factor.eq(UNITS.m.factor.mul(SI_PREFIXES.k))).toBe(true);
  });

  it('unknown unit returns null', () => {
    expect(resolveUnit('foobar')).toBeNull();
  });

  it('getUnit returns UnitDef or null', () => {
    expect(getUnit('m')).toBe(UNITS.m);
    expect(getUnit('nope')).toBeNull();
  });

  it('pickAutoScaledUnit prefers readable scales within family', () => {
    // Start with meters family; value is in base meters
    const last = 'm';
    const val = new Decimal(0.0025); // 2.5 mm
    const picked = pickAutoScaledUnit(last, val);
    expect(picked?.symbol).toBe('mm');

    const val2 = new Decimal(12000); // 12 km
    const picked2 = pickAutoScaledUnit(last, val2);
    expect(picked2?.symbol).toBe('km');
  });

  it('getDisplayUnitAndFactor chooses last compatible unit, else base/composite', () => {
    const L = UNITS.m.dims;
    const res1 = getDisplayUnitAndFactor({ dims: L, lastUnitName: 'km' });
    expect(res1.unit).toBe('km');
    expect(res1.factor.eq(UNITS.km.factor)).toBe(true);

    const res2 = getDisplayUnitAndFactor({ dims: L, lastUnitName: 's' });
    expect(res2.unit).toBe('m');

    const compositeDims: typeof UNITS.m.dims = [1,0,-1,0,0,0,0]; // m/s
    const res3 = getDisplayUnitAndFactor({ dims: compositeDims, lastUnitName: null });
    expect(res3.unit).toBe('m/s');
    expect(res3.factor.eq(1)).toBe(true as any);
  });
});