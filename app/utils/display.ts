import Decimal from "decimal.js";
import type { Token } from "./tokeniser";
import type { Quantity } from "./units";
import { getDisplayUnitAndFactor } from "./units";
import type { UserPrefs } from "./units";

export interface FormatOptions {
  fractional?: boolean;
  maxDenominator?: number;
}

function approximateFraction(value: number, maxDenominator: number): { n: number; d: number } | null {
  if (!Number.isFinite(value)) return null;
  const sign = value < 0 ? -1 : 1;
  let x = Math.abs(value);
  if (Number.isInteger(x)) return { n: sign * Math.trunc(x), d: 1 };
  // Continued fraction approximation
  let h1 = 1, h0 = 0;
  let k1 = 0, k0 = 1;
  let b = x;
  for (let i = 0; i < 64; i++) {
    const a = Math.floor(b);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > maxDenominator) break;
    h0 = h1; h1 = h2;
    k0 = k1; k1 = k2;
    const frac = b - a;
    if (frac < 1e-18) break;
    b = 1 / frac;
  }
  if (k1 === 0) return null;
  return { n: sign * h1, d: k1 };
}

export function formatResult(num: number, opts?: FormatOptions): string {
  if (!Number.isFinite(num)) {
    if (Number.isNaN(num)) return "NaN";
    return num === Infinity ? "Infinity" : num === -Infinity ? "-Infinity" : "NaN";
  }
  // Fractional mode: try to render as n/d if enabled
  if (opts?.fractional) {
    const maxDen = opts.maxDenominator ?? 10000;
    const approx = approximateFraction(num, maxDen);
    if (approx) {
      if (approx.d === 1) return approx.n.toString();
      const absN = Math.abs(approx.n);
      if (absN > approx.d) {
        const whole = Math.trunc(absN / approx.d) * Math.sign(approx.n);
        const rem = absN % approx.d;
        if (rem === 0) return whole.toString();
        const remStr = `${rem}/${approx.d}`;
        return `${whole} ${remStr}`;
      }
      return `${approx.n}/${approx.d}`;
    }
  }
  if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(6);
  }
  if (Number.isInteger(num)) {
    return num.toString();
  }
  const rounded = Math.round(num * 1e10) / 1e10;
  return rounded.toString();
}

// Formats Decimal without converting to JS number to avoid overflow/Infinity
export function formatDecimal(d: Decimal): string {
  if (!d.isFinite()) {
    if (d.isNaN()) return "NaN";
    return d.isPos() ? "Infinity" : "-Infinity";
  }
  const abs = d.abs();
  if (abs.gt(new Decimal(1e15)) || (abs.lt(new Decimal(1e-6)) && !d.eq(0))) {
    // toExponential with fixed significant digits
    const str = d.toExponential(6);
    return str;
  }
  if (d.isInteger()) return d.toString();
  // Round to 10 decimal places without floating to Number
  const rounded = d.toDecimalPlaces(10);
  return rounded.toString();
}

export function getLastUnitFromTokens(tokens: Token[]): { name: string; factor: Decimal } | null {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i] as any;
    if (t && t.type === "unit") return { name: t.name as string, factor: t.factor as Decimal };
  }
  return null;
}

export function chooseDisplayFor(tokens: Token[], quantity: Quantity, prefs?: UserPrefs): { display: Decimal; unit: string | null } {
  const lastUnit = getLastUnitFromTokens(tokens);
  const args: { dims: typeof quantity.dims; valueInBase?: Decimal; lastUnitName?: string | null; prefs?: UserPrefs } = {
    dims: quantity.dims,
    valueInBase: quantity.value,
    lastUnitName: lastUnit?.name ?? null,
  };
  if (prefs) args.prefs = prefs;
  const displayChoice = getDisplayUnitAndFactor(args);
  const display = quantity.value.div(displayChoice.factor);
  return { display, unit: displayChoice.unit };
}