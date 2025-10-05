import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { ZERO_DIMS, type DimensionVector } from '../types.ts';
import { makeScalar, multiply, divide, add, sub, pow, isDimensionless, dimsEqual, formatUnitFromDims } from '../ops.ts';

describe('ops', () => {
  it('makeScalar creates dimensionless quantity', () => {
    const q = makeScalar(new Decimal(5));
    expect(isDimensionless(q)).toBe(true);
    expect(q.value.eq(5)).toBe(true);
  });

  it('multiply and divide combine dimensions', () => {
    const mDims: DimensionVector = [1,0,0,0,0,0,0];
    const sDims: DimensionVector = [0,0,1,0,0,0,0];
    const m = { value: new Decimal(3), dims: mDims };
    const s = { value: new Decimal(2), dims: sDims };
    const prod = multiply(m, s);
    expect(prod.value.eq(6)).toBe(true);
    expect(prod.dims).toEqual([1,0,1,0,0,0,0]);

    const div = divide(m, s);
    expect(div.value.eq(1.5)).toBe(true);
    expect(div.dims).toEqual([1,0,-1,0,0,0,0]);
  });

  it('add/sub require same dimensions', () => {
    const a = { value: new Decimal(2), dims: ZERO_DIMS };
    const b = { value: new Decimal(3), dims: ZERO_DIMS };
    expect(add(a,b).value.toNumber()).toBe(5);
    expect(sub(b,a).value.toNumber()).toBe(1);

    const m = { value: new Decimal(1), dims: [1,0,0,0,0,0,0] as DimensionVector };
    expect(() => add(a, m)).toThrow();
  });

  it('pow with integer exponent scales dims', () => {
    const m = { value: new Decimal(4), dims: [1,0,0,0,0,0,0] as DimensionVector };
    const squared = pow(m, new Decimal(2));
    expect(squared.value.eq(16)).toBe(true);
    expect(squared.dims).toEqual([2,0,0,0,0,0,0]);
  });

  it('pow with fractional exponent allowed only if resulting dims are integers', () => {
    const area = { value: new Decimal(9), dims: [2,0,0,0,0,0,0] as DimensionVector };
    const root = pow(area, new Decimal(0.5));
    expect(root.value.eq(3)).toBe(true);
    expect(root.dims).toEqual([1,0,0,0,0,0,0]);

    const weird = { value: new Decimal(8), dims: [1,0,0,0,0,0,0] as DimensionVector };
    expect(() => pow(weird, new Decimal(1/3))).toThrow();
  });

  it('dimsEqual and formatUnitFromDims', () => {
    expect(dimsEqual(ZERO_DIMS, [0,0,0,0,0,0,0] as DimensionVector)).toBe(true);
    expect(formatUnitFromDims(ZERO_DIMS)).toBe(null);
    expect(formatUnitFromDims([1,0,0,0,0,0,0] as DimensionVector)).toBe('m');
    expect(formatUnitFromDims([2,0,-2,0,0,0,0] as DimensionVector)).toBe('m^2/s^2');
    expect(formatUnitFromDims([0,1,0,0,0,0,0] as DimensionVector)).toBe('g');
  });
});