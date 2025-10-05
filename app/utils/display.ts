import Decimal from "decimal.js";
import type { Token } from "./tokeniser";
import type { Quantity } from "./units";
import { getDisplayUnitAndFactor } from "./units";
import type { UserPrefs } from "./units";

export function formatResult(num: number): string {
  if (!Number.isFinite(num)) {
    if (Number.isNaN(num)) return "NaN";
    return num === Infinity ? "Infinity" : num === -Infinity ? "-Infinity" : "NaN";
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