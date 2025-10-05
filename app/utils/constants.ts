import Decimal from "decimal.js";
import { UNITS } from "./units/registry";
import type { Quantity } from "./units/types";

// Helper to build quantities that are ratios of units, by dividing factor manually
function quantityFrom(value: number | string, numUnit: string, denUnit?: string): Quantity {
    const v = new Decimal(value);
    const num = UNITS[numUnit];
    if (!num) throw new Error(`Unknown unit ${numUnit}`);
    let q: Quantity = { value: v.mul(num.factor), dims: num.dims } as Quantity;
    if (denUnit) {
        const den = UNITS[denUnit];
        if (!den) throw new Error(`Unknown unit ${denUnit}`);
        // divide value and subtract dims
        q = { value: q.value.div(den.factor), dims: [
            (q.dims[0] as number) - den.dims[0],
            (q.dims[1] as number) - den.dims[1],
            (q.dims[2] as number) - den.dims[2],
            (q.dims[3] as number) - den.dims[3],
            (q.dims[4] as number) - den.dims[4],
            (q.dims[5] as number) - den.dims[5],
            (q.dims[6] as number) - den.dims[6],
        ] as any };
    }
    return q;
}

export const DEFAULT_CONSTANTS: Record<string, Quantity> = {
    // Mathematical
    tau: { value: new Decimal(2).mul(Decimal.acos(-1)), dims: [0,0,0,0,0,0,0] } as any,
    phi: { value: new Decimal(1).add(new Decimal(5).sqrt()).div(2), dims: [0,0,0,0,0,0,0] } as any,

    // Physical
    c: quantityFrom(299792458, "m", "s"),
    G: (() => {
        // 6.67430e-11 m^3 kg^-1 s^-2
        const val = new Decimal("6.67430e-11");
        const m3 = UNITS["m3"]!; const kg = UNITS["kg"]!; const s = UNITS["s"]!;
        return { value: val.mul(m3.factor).div(kg.factor).div(s.factor.pow(2)), dims: [
            m3.dims[0] - kg.dims[0] - 2 * s.dims[0],
            m3.dims[1] - kg.dims[1] - 2 * s.dims[1],
            m3.dims[2] - kg.dims[2] - 2 * s.dims[2],
            m3.dims[3] - kg.dims[3] - 2 * s.dims[3],
            m3.dims[4] - kg.dims[4] - 2 * s.dims[4],
            m3.dims[5] - kg.dims[5] - 2 * s.dims[5],
            m3.dims[6] - kg.dims[6] - 2 * s.dims[6],
        ] as any };
    })(),
    h: (() => {
        // 6.62607015e-34 J s
        const val = new Decimal("6.62607015e-34");
        const J = UNITS["J"]!; const s = UNITS["s"]!;
        return { value: val.mul(J.factor).mul(s.factor), dims: [
            J.dims[0] + s.dims[0],
            J.dims[1] + s.dims[1],
            J.dims[2] + s.dims[2],
            J.dims[3] + s.dims[3],
            J.dims[4] + s.dims[4],
            J.dims[5] + s.dims[5],
            J.dims[6] + s.dims[6],
        ] as any };
    })(),
    hbar: (() => {
        const twoPi = new Decimal(2).mul(Decimal.acos(-1));
        // Recompute from definitions to avoid self-reference
        const h_val = new Decimal("6.62607015e-34");
        const J = UNITS["J"]!; const s = UNITS["s"]!;
        const hQuantity: Quantity = { value: h_val.mul(J.factor).mul(s.factor), dims: [
            J.dims[0] + s.dims[0],
            J.dims[1] + s.dims[1],
            J.dims[2] + s.dims[2],
            J.dims[3] + s.dims[3],
            J.dims[4] + s.dims[4],
            J.dims[5] + s.dims[5],
            J.dims[6] + s.dims[6],
        ] as any };
        return { value: hQuantity.value.div(twoPi), dims: hQuantity.dims } as Quantity;
    })(),
    kB: (() => {
        // 1.380649e-23 J/K
        const val = new Decimal("1.380649e-23");
        const J = UNITS["J"]!; const K = UNITS["K"]!;
        return { value: val.mul(J.factor).div(K.factor), dims: [
            J.dims[0] - K.dims[0],
            J.dims[1] - K.dims[1],
            J.dims[2] - K.dims[2],
            J.dims[3] - K.dims[3],
            J.dims[4] - K.dims[4],
            J.dims[5] - K.dims[5],
            J.dims[6] - K.dims[6],
        ] as any };
    })(),
    NA: (() => {
        // 6.02214076e23 1/mol
        const val = new Decimal("6.02214076e23");
        const mol = UNITS["mol"]!;
        return { value: val.div(mol.factor), dims: [
            -mol.dims[0], -mol.dims[1], -mol.dims[2], -mol.dims[3], -mol.dims[4], -mol.dims[5], -mol.dims[6],
        ] as any };
    })(),
    R: (() => {
        // 8.314462618 J/(mol·K)
        const val = new Decimal("8.314462618");
        const J = UNITS["J"]!; const mol = UNITS["mol"]!; const K = UNITS["K"]!;
        return { value: val.mul(J.factor).div(mol.factor).div(K.factor), dims: [
            J.dims[0] - mol.dims[0] - K.dims[0],
            J.dims[1] - mol.dims[1] - K.dims[1],
            J.dims[2] - mol.dims[2] - K.dims[2],
            J.dims[3] - mol.dims[3] - K.dims[3],
            J.dims[4] - mol.dims[4] - K.dims[4],
            J.dims[5] - mol.dims[5] - K.dims[5],
            J.dims[6] - mol.dims[6] - K.dims[6],
        ] as any };
    })(),
    qe: (() => {
        // 1.602176634e-19 C
        const val = new Decimal("1.602176634e-19");
        const C = UNITS["C"]!;
        return { value: val.mul(C.factor), dims: C.dims } as any;
    })(),
    me: (() => {
        const kg = UNITS["kg"]!; const val = new Decimal("9.1093837015e-31");
        return { value: val.mul(kg.factor), dims: kg.dims } as any;
    })(),
    mp: (() => {
        const kg = UNITS["kg"]!; const val = new Decimal("1.67262192369e-27");
        return { value: val.mul(kg.factor), dims: kg.dims } as any;
    })(),
    eps0: (() => {
        // 8.8541878128e-12 F/m
        const val = new Decimal("8.8541878128e-12");
        const F = UNITS["F"]!; const m = UNITS["m"]!;
        return { value: val.mul(F.factor).div(m.factor), dims: [
            F.dims[0] - m.dims[0],
            F.dims[1] - m.dims[1],
            F.dims[2] - m.dims[2],
            F.dims[3] - m.dims[3],
            F.dims[4] - m.dims[4],
            F.dims[5] - m.dims[5],
            F.dims[6] - m.dims[6],
        ] as any };
    })(),
    mu0: (() => {
        // 1.25663706212e-6 N/A^2
        const val = new Decimal("1.25663706212e-6");
        const N = UNITS["N"]!; const A = UNITS["A"]!;
        return { value: val.mul(N.factor).div(A.factor.pow(2)), dims: [
            N.dims[0] - 2*A.dims[0],
            N.dims[1] - 2*A.dims[1],
            N.dims[2] - 2*A.dims[2],
            N.dims[3] - 2*A.dims[3],
            N.dims[4] - 2*A.dims[4],
            N.dims[5] - 2*A.dims[5],
            N.dims[6] - 2*A.dims[6],
        ] as any };
    })(),

    // Additional constants
    // Atomic mass constant (Dalton)
    u: (() => {
        const val = new Decimal("1.66053906660e-27");
        const kg = UNITS["kg"]!; return { value: val.mul(kg.factor), dims: kg.dims } as any;
    })(),
    amu: (() => {
        const val = new Decimal("1.66053906660e-27");
        const kg = UNITS["kg"]!; return { value: val.mul(kg.factor), dims: kg.dims } as any;
    })(),
    // Rydberg constant R∞ (m^-1)
    Rinf: (() => {
        const val = new Decimal("10973731.568160");
        const m = UNITS["m"]!; return { value: val.div(m.factor), dims: [
            -m.dims[0], -m.dims[1], -m.dims[2], -m.dims[3], -m.dims[4], -m.dims[5], -m.dims[6],
        ] as any };
    })(),
    // Stefan–Boltzmann constant σ (W·m^-2·K^-4)
    sigmaSB: (() => {
        const val = new Decimal("5.670374419e-8");
        const W = UNITS["W"]!; const m = UNITS["m"]!; const K = UNITS["K"]!;
        return { value: val.mul(W.factor).div(m.factor.pow(2)).div(K.factor.pow(4)), dims: [
            W.dims[0] - 2*m.dims[0] - 4*K.dims[0],
            W.dims[1] - 2*m.dims[1] - 4*K.dims[1],
            W.dims[2] - 2*m.dims[2] - 4*K.dims[2],
            W.dims[3] - 2*m.dims[3] - 4*K.dims[3],
            W.dims[4] - 2*m.dims[4] - 4*K.dims[4],
            W.dims[5] - 2*m.dims[5] - 4*K.dims[5],
            W.dims[6] - 2*m.dims[6] - 4*K.dims[6],
        ] as any };
    })(),
    // Standard gravity g0 (m/s^2)
    g0: (() => quantityFrom("9.80665", "m", "s"))(),
    // Bohr magneton μB (J/T)
    muB: (() => {
        const val = new Decimal("9.2740100783e-24");
        const J = UNITS["J"]!; const T = UNITS["T"]!;
        return { value: val.mul(J.factor).div(T.factor), dims: [
            J.dims[0] - T.dims[0],
            J.dims[1] - T.dims[1],
            J.dims[2] - T.dims[2],
            J.dims[3] - T.dims[3],
            J.dims[4] - T.dims[4],
            J.dims[5] - T.dims[5],
            J.dims[6] - T.dims[6],
        ] as any };
    })(),
    // Nuclear magneton μN (J/T)
    muN: (() => {
        const val = new Decimal("5.0507837461e-27");
        const J = UNITS["J"]!; const T = UNITS["T"]!;
        return { value: val.mul(J.factor).div(T.factor), dims: [
            J.dims[0] - T.dims[0],
            J.dims[1] - T.dims[1],
            J.dims[2] - T.dims[2],
            J.dims[3] - T.dims[3],
            J.dims[4] - T.dims[4],
            J.dims[5] - T.dims[5],
            J.dims[6] - T.dims[6],
        ] as any };
    })(),
    // Fine-structure constant α (dimensionless)
    alpha: { value: new Decimal("7.2973525693e-3"), dims: [0,0,0,0,0,0,0] } as any,
    // Faraday constant (C/mol)
    Faraday: (() => {
        const val = new Decimal("96485.33212");
        const C = UNITS["C"]!; const mol = UNITS["mol"]!;
        return { value: val.mul(C.factor).div(mol.factor), dims: [
            C.dims[0] - mol.dims[0],
            C.dims[1] - mol.dims[1],
            C.dims[2] - mol.dims[2],
            C.dims[3] - mol.dims[3],
            C.dims[4] - mol.dims[4],
            C.dims[5] - mol.dims[5],
            C.dims[6] - mol.dims[6],
        ] as any };
    })(),
    // h*c (J·m)
    hc: (() => {
        // h = 6.62607015e-34 J·s
        const hVal = new Decimal("6.62607015e-34");
        const J = UNITS["J"]!; const s = UNITS["s"]!; const m = UNITS["m"]!;
        const hQ: Quantity = { value: hVal.mul(J.factor).mul(s.factor), dims: [
            J.dims[0] + s.dims[0],
            J.dims[1] + s.dims[1],
            J.dims[2] + s.dims[2],
            J.dims[3] + s.dims[3],
            J.dims[4] + s.dims[4],
            J.dims[5] + s.dims[5],
            J.dims[6] + s.dims[6],
        ] as any };
        // c = 299792458 m/s -> build quantity directly
        const cQ: Quantity = { value: new Decimal(299792458).mul(m.factor).div(s.factor), dims: [
            m.dims[0] - s.dims[0],
            m.dims[1] - s.dims[1],
            m.dims[2] - s.dims[2],
            m.dims[3] - s.dims[3],
            m.dims[4] - s.dims[4],
            m.dims[5] - s.dims[5],
            m.dims[6] - s.dims[6],
        ] as any };
        return { value: hQ.value.mul(cQ.value), dims: [
            hQ.dims[0] + (cQ.dims[0] as number),
            hQ.dims[1] + (cQ.dims[1] as number),
            hQ.dims[2] + (cQ.dims[2] as number),
            hQ.dims[3] + (cQ.dims[3] as number),
            hQ.dims[4] + (cQ.dims[4] as number),
            hQ.dims[5] + (cQ.dims[5] as number),
            hQ.dims[6] + (cQ.dims[6] as number),
        ] as any };
    })(),
};

export const CONSTANT_DESCRIPTIONS: Record<string, string> = {
    tau: "Circle constant 2π",
    phi: "Golden ratio",
    c: "Speed of light (m/s)",
    G: "Gravitational constant",
    h: "Planck constant",
    hbar: "Reduced Planck constant",
    kB: "Boltzmann constant",
    NA: "Avogadro constant",
    R: "Molar gas constant",
    qe: "Elementary charge",
    me: "Electron mass",
    mp: "Proton mass",
    eps0: "Vacuum permittivity",
    mu0: "Vacuum permeability",
    u: "Atomic mass constant (Dalton)",
    amu: "Atomic mass unit (alias of u)",
    Rinf: "Rydberg constant",
    sigmaSB: "Stefan–Boltzmann constant",
    g0: "Standard gravity",
    muB: "Bohr magneton",
    muN: "Nuclear magneton",
    alpha: "Fine-structure constant",
    Faraday: "Faraday constant",
    hc: "Planck constant times speed of light",
};