import Decimal from "decimal.js";
import { DimensionVector, Quantity, ZERO_DIMS } from "./types";

export function makeScalar(value: Decimal): Quantity {
	return { value, dims: ZERO_DIMS };
}

export function multiply(a: Quantity, b: Quantity): Quantity {
	return { value: a.value.mul(b.value), dims: addDims(a.dims, b.dims) };
}

export function divide(a: Quantity, b: Quantity): Quantity {
	return { value: a.value.div(b.value), dims: addDims(a.dims, negateDims(b.dims)) };
}

export function add(a: Quantity, b: Quantity): Quantity {
	if (!dimsEqual(a.dims, b.dims)) throw new Error("DIMENSION_MISMATCH");
	return { value: a.value.add(b.value), dims: a.dims };
}

export function sub(a: Quantity, b: Quantity): Quantity {
	if (!dimsEqual(a.dims, b.dims)) throw new Error("DIMENSION_MISMATCH");
	return { value: a.value.sub(b.value), dims: a.dims };
}

export function pow(a: Quantity, exponent: Decimal): Quantity {
	const k = exponent.toNumber();
	if (!Number.isFinite(k)) throw new Error("BAD_UNIT_POWER");
	if (!exponent.isInteger() && !isDimensionless(a)) {
		// Allow rational exponents if all resulting exponents are integers
		for (let i = 0; i < 7; i++) {
			const newExp = new Decimal(a.dims[i]!).mul(exponent);
			// Check if the result is close to an integer (within precision tolerance)
			const rounded = newExp.round();
			const diff = newExp.sub(rounded).abs();
			if (diff.gt(new Decimal(1e-10))) throw new Error("BAD_UNIT_POWER");
		}
		// Safe to scale dims by k because each component times exponent is integer
		const newDimsArr: number[] = [0, 0, 0, 0, 0, 0, 0];
		for (let i = 0; i < 7; i++) newDimsArr[i] = new Decimal(a.dims[i]!).mul(exponent).toNumber();
		return { value: a.value.pow(exponent), dims: newDimsArr as unknown as DimensionVector };
	}
	return { value: a.value.pow(exponent), dims: scaleDims(a.dims, k) };
}

export function isDimensionless(q: Quantity): boolean {
	return dimsEqual(q.dims, ZERO_DIMS);
}

export function dimsEqual(a: DimensionVector, b: DimensionVector): boolean {
	for (let i = 0; i < 7; i++) if (a[i] !== b[i]) return false;
	return true;
}

export function addDims(a: DimensionVector, b: DimensionVector): DimensionVector {
	return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3], a[4] + b[4], a[5] + b[5], a[6] + b[6]];
}

export function negateDims(a: DimensionVector): DimensionVector {
	return [-a[0], -a[1], -a[2], -a[3], -a[4], -a[5], -a[6]];
}

export function scaleDims(a: DimensionVector, k: number): DimensionVector {
	return [a[0] * k, a[1] * k, a[2] * k, a[3] * k, a[4] * k, a[5] * k, a[6] * k];
}

/** Formats a dimension vector using SI base symbols into a canonical composite unit string like "m^2/s^2". */
export function formatUnitFromDims(dims: DimensionVector): string | null {
	const symbols: readonly string[] = ["m", "g", "s", "A", "K", "mol", "cd"];
	const numParts: string[] = [];
	const denParts: string[] = [];
	for (let i = 0; i < 7; i++) {
		const exp = dims[i] as number;
		if (exp === 0) continue;
		const sym = symbols[i]!;
		const abs = Math.abs(exp);
		const piece = abs === 1 ? sym : `${sym}^${abs}`;
		if (exp > 0) numParts.push(piece);
		else denParts.push(piece);
	}
	if (numParts.length === 0 && denParts.length === 0) return null;
	if (denParts.length === 0) return numParts.join("*");
	const num = numParts.length ? numParts.join("*") : "1";
	return `${num}/${denParts.join("*")}`;
}