import Decimal from "decimal.js";

export type DimensionVector = readonly [number, number, number, number, number, number, number];
// Order: L (length), M (mass), T (time), I (electric current), Θ (temperature), N (amount), J (luminous intensity)
export const ZERO_DIMS: DimensionVector = [0, 0, 0, 0, 0, 0, 0];

export type UnitDef = {
	symbol: string;
	factor: Decimal; // scale relative to SI base unit of its dimension
	dims: DimensionVector;
};

export type Quantity = {
	value: Decimal; // magnitude in SI base units per dims
	dims: DimensionVector;
};