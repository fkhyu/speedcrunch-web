import Decimal from "decimal.js";
import { DimensionVector, UnitDef, ZERO_DIMS } from "./types";
import { dimsEqual, formatUnitFromDims } from "./ops";

// Toggle for accepting friendly long-form unit names (e.g., "hour" -> "h")
let USE_FRIENDLY_UNIT_ALIASES = true;
export function setFriendlyUnitAliasesEnabled(enabled: boolean) {
    USE_FRIENDLY_UNIT_ALIASES = enabled;
}

// Common long-form aliases mapped to canonical symbols present in UNITS
const FRIENDLY_UNIT_ALIASES: Record<string, string> = {
    // time
    hour: "h",
    hours: "h",
    minute: "min",
    minutes: "min",
    second: "s",
    seconds: "s",
    day: "day",
    days: "day",
    week: "week",
    weeks: "week",
    // length
    meter: "m",
    metres: "m",
    meters: "m",
    metre: "m",
    // mass
    gram: "g",
    grams: "g",
    kilogram: "kg",
    kilograms: "kg",
    // angle
    degree: "deg",
    degrees: "deg",
    radian: "rad",
    radians: "rad",
    "°": "deg",
    "′": "arcmin",
    "″": "arcsec",
    arcminute: "arcmin",
    arcminutes: "arcmin",
    amin: "arcmin",
    arcsecond: "arcsec",
    arcseconds: "arcsec",
    asec: "arcsec",
	// synonyms and duplicates
	hr: "h",
	ohm: "Ω",
	// imperial length
	inch: "in",
	inches: "in",
	foot: "ft",
	feet: "ft",
	yard: "yd",
	yards: "yd",
	mile: "mi",
	miles: "mi",
	nautical_mile: "nmi",
	nautical_miles: "nmi",
	fathom: "ftm",
	fathoms: "ftm",
	// astr
	lightyear: "ly",
	lightyears: "ly",
	lightminute: "lmin",
	lightminutes: "lmin",
	lightsecond: "ls",
	lightseconds: "ls",
	parsec: "pc",
	parsecs: "pc",
	astronomical_unit: "au",
	astronomical_units: "au",
	// mass
	pound: "lb",
	pounds: "lb",
	ounce: "oz",
	ounces: "oz",
	stone: "st",
	stones: "st",
	ton: "ton",
	tons: "ton",
	// volume (metric + imperial)
    liter: "L",
    litre: "L",
    liters: "L",
    litres: "L",
    l: "L",
	milliliter: "mL",
	millilitre: "mL",
	milliliters: "mL",
	millilitres: "mL",
	cubic_meter: "m3",
	gallon: "gal",
	gallons: "gal",
	quart: "qt",
	quarts: "qt",
	pint: "pt",
	pints: "pt",
	cup: "cup",
	cups: "cup",
	fluid_ounce: "fl_oz",
	fluid_ounces: "fl_oz",
	tablespoon: "tbsp",
	tablespoons: "tbsp",
	teaspoon: "tsp",
	teaspoons: "tsp",
	// area (avoid mapping to non-existent shorthand; prefer composite formatting)
	acre: "acre",
	acres: "acre",
	hectare: "ha",
	hectares: "ha",
	// speed
	mph: "mph",
	kph: "kph",
	knots: "kn",
	mach: "Ma",
    // energy/power/pressure
	joules: "J",
	watts: "W",
	kilowatts: "kW",
	horsepower: "hp",
	pascals: "Pa",
	atmospheres: "atm",
	torr: "Torr",
	psi: "psi",
    electronvolt: "eV",
    electronvolts: "eV",
    // frequency
	hertz: "Hz",
	kilohertz: "kHz",
	megahertz: "MHz",
	gigahertz: "GHz",
    // data
	byte: "B",
	bytes: "B",
	kilobyte: "kB",
	kilobytes: "kB",
	megabyte: "MB",
	megabytes: "MB",
	gigabyte: "GB",
	gigabytes: "GB",
	terabyte: "TB",
	terabytes: "TB",
	petabyte: "PB",
	petabytes: "PB",
    // logarithmic ratio units (dimensionless)
    neper: "Np",
    nepers: "Np",
    decibel: "dB",
    decibels: "dB",

    // currency (treated dimensionless)
	dollar: "USD",
	dollars: "USD",
	euro: "EUR",
	euros: "EUR",
	pounds_sterling: "GBP",
	yen: "JPY",
    // SI accepted non-SI names
    tonne: "t",
    tonnes: "t",
    // time shorthand
    d: "day",
	// fun units
	banana: "banana",
	bananas: "banana",
	olympic_pool: "olympic_pool",
	olympic_swimming_pool: "olympic_pool",
	olympic_swimming_pools: "olympic_pool",
	football_field: "football_field",
	football_fields: "football_field",
};

export const SI_PREFIXES: Readonly<Record<
    | "Y" | "Z" | "E" | "P" | "T" | "G" | "M" | "k" | "h" | "da"
    | "d" | "c" | "m" | "u" | "μ" | "n" | "p" | "f" | "a" | "z" | "y",
    Decimal
>> = Object.freeze({
	Y: new Decimal(1e24),
	Z: new Decimal(1e21),
	E: new Decimal(1e18),
	P: new Decimal(1e15),
	T: new Decimal(1e12),
	G: new Decimal(1e9),
	M: new Decimal(1e6),
	k: new Decimal(1e3),
	h: new Decimal(1e2),
	da: new Decimal(1e1),
	d: new Decimal(1e-1),
	c: new Decimal(1e-2),
	m: new Decimal(1e-3),
	u: new Decimal(1e-6), // common micro
	μ: new Decimal(1e-6),
	n: new Decimal(1e-9),
	p: new Decimal(1e-12),
	f: new Decimal(1e-15),
	a: new Decimal(1e-18),
	z: new Decimal(1e-21),
	y: new Decimal(1e-24),
});

const UNITS_MUTABLE: Record<string, UnitDef> = {
	m: { symbol: "m", factor: new Decimal(1), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	s: { symbol: "s", factor: new Decimal(1), dims: [0, 0, 1, 0, 0, 0, 0] as DimensionVector },
	g: { symbol: "g", factor: new Decimal(1), dims: [0, 1, 0, 0, 0, 0, 0] as DimensionVector },
	kg: { symbol: "kg", factor: new Decimal(1000), dims: [0, 1, 0, 0, 0, 0, 0] as DimensionVector },
	A: { symbol: "A", factor: new Decimal(1), dims: [0, 0, 0, 1, 0, 0, 0] as DimensionVector },
	K: { symbol: "K", factor: new Decimal(1), dims: [0, 0, 0, 0, 1, 0, 0] as DimensionVector },
	mol: { symbol: "mol", factor: new Decimal(1), dims: [0, 0, 0, 0, 0, 1, 0] as DimensionVector },
	cd: { symbol: "cd", factor: new Decimal(1), dims: [0, 0, 0, 0, 0, 0, 1] as DimensionVector },
	// Angle units (dimensionless scale factors)
	rad: { symbol: "rad", factor: new Decimal(1), dims: [0, 0, 0, 0, 0, 0, 0] as DimensionVector },
	deg: { symbol: "deg", factor: new Decimal(Math.PI / 180), dims: [0, 0, 0, 0, 0, 0, 0] as DimensionVector },
	arcmin: { symbol: "arcmin", factor: new Decimal(Math.PI / 180).div(60), dims: [0, 0, 0, 0, 0, 0, 0] as DimensionVector },
	arcsec: { symbol: "arcsec", factor: new Decimal(Math.PI / 180).div(3600), dims: [0, 0, 0, 0, 0, 0, 0] as DimensionVector },
	// Common length aliases
	km: { symbol: "km", factor: new Decimal(1000), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	cm: { symbol: "cm", factor: new Decimal(0.01), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	mm: { symbol: "mm", factor: new Decimal(0.001), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	// Time units
	min: { symbol: "min", factor: new Decimal(60), dims: [0, 0, 1, 0, 0, 0, 0] as DimensionVector },
	h: { symbol: "h", factor: new Decimal(3600), dims: [0, 0, 1, 0, 0, 0, 0] as DimensionVector },
  	// keep only canonical symbol 'h'; map 'hr' via alias above
	day: { symbol: "day", factor: new Decimal(86400), dims: [0, 0, 1, 0, 0, 0, 0] as DimensionVector },
	week: { symbol: "week", factor: new Decimal(604800), dims: [0, 0, 1, 0, 0, 0, 0] as DimensionVector },
	// Derived SI units (based on base of g, m, s)
	N: { symbol: "N", factor: new Decimal(1000), dims: [1, 1, -2, 0, 0, 0, 0] as DimensionVector },
	J: { symbol: "J", factor: new Decimal(1000), dims: [2, 1, -2, 0, 0, 0, 0] as DimensionVector },
	W: { symbol: "W", factor: new Decimal(1000), dims: [2, 1, -3, 0, 0, 0, 0] as DimensionVector },
	Pa: { symbol: "Pa", factor: new Decimal(1000), dims: [-1, 1, -2, 0, 0, 0, 0] as DimensionVector },
    // Accepted non-SI: electronvolt
    eV: { symbol: "eV", factor: new Decimal(1.602176634e-19).mul(1000), dims: [2, 1, -2, 0, 0, 0, 0] as DimensionVector },
	// Frequency
	Hz: { symbol: "Hz", factor: new Decimal(1), dims: [0, 0, -1, 0, 0, 0, 0] as DimensionVector },
	// Electric charge
	C: { symbol: "C", factor: new Decimal(1), dims: [0, 0, 1, 1, 0, 0, 0] as DimensionVector },
	// Electric potential, resistance, conductance
	V: { symbol: "V", factor: new Decimal(1000), dims: [2, 1, -3, -1, 0, 0, 0] as DimensionVector },
	Ω: { symbol: "Ω", factor: new Decimal(1000), dims: [2, 1, -3, -2, 0, 0, 0] as DimensionVector },
	S: { symbol: "S", factor: new Decimal(1).div(1000), dims: [-2, -1, 3, 2, 0, 0, 0] as DimensionVector },
	// Capacitance, inductance, magnetic units
	F: { symbol: "F", factor: new Decimal(1).div(1000), dims: [-2, -1, 4, 2, 0, 0, 0] as DimensionVector },
	H: { symbol: "H", factor: new Decimal(1000), dims: [2, 1, -2, -2, 0, 0, 0] as DimensionVector },
	Wb: { symbol: "Wb", factor: new Decimal(1000), dims: [2, 1, -2, -1, 0, 0, 0] as DimensionVector },
	T: { symbol: "T", factor: new Decimal(1000), dims: [0, 1, -2, -1, 0, 0, 0] as DimensionVector },
	// Photometry
	lm: { symbol: "lm", factor: new Decimal(1), dims: [0, 0, 0, 0, 0, 0, 1] as DimensionVector },
	lx: { symbol: "lx", factor: new Decimal(1), dims: [-2, 0, 0, 0, 0, 0, 1] as DimensionVector },
	// Imperial length
	in: { symbol: "in", factor: new Decimal(0.0254), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	ft: { symbol: "ft", factor: new Decimal(0.3048), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	yd: { symbol: "yd", factor: new Decimal(0.9144), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	mi: { symbol: "mi", factor: new Decimal(1609.344), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	nmi: { symbol: "nmi", factor: new Decimal(1852), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	ftm: { symbol: "ftm", factor: new Decimal(1.8288), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	// Astronomical
	ly: { symbol: "ly", factor: new Decimal(299792458).mul(60).mul(60).mul(24).mul(365.25), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	lmin: { symbol: "lmin", factor: new Decimal(299792458).mul(60), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	ls: { symbol: "ls", factor: new Decimal(299792458), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	pc: { symbol: "pc", factor: new Decimal(3.0856775814913673e16), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	au: { symbol: "au", factor: new Decimal(149597870700), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	// Mass (imperial)
	lb: { symbol: "lb", factor: new Decimal(0.45359237).mul(1000), dims: [0, 1, 0, 0, 0, 0, 0] as DimensionVector },
	oz: { symbol: "oz", factor: new Decimal(0.028349523125).mul(1000), dims: [0, 1, 0, 0, 0, 0, 0] as DimensionVector },
	st: { symbol: "st", factor: new Decimal(6.35029318).mul(1000), dims: [0, 1, 0, 0, 0, 0, 0] as DimensionVector },
	ton: { symbol: "ton", factor: new Decimal(907.18474).mul(1000), dims: [0, 1, 0, 0, 0, 0, 0] as DimensionVector },
	// Mass (SI accepted non-SI): metric tonne
	t: { symbol: "t", factor: new Decimal(1_000_000), dims: [0, 1, 0, 0, 0, 0, 0] as DimensionVector },
	// Volume
	L: { symbol: "L", factor: new Decimal(0.001), dims: [3, 0, 0, 0, 0, 0, 0] as DimensionVector },
	mL: { symbol: "mL", factor: new Decimal(1).div(1e6), dims: [3, 0, 0, 0, 0, 0, 0] as DimensionVector },
	m3: { symbol: "m3", factor: new Decimal(1), dims: [3, 0, 0, 0, 0, 0, 0] as DimensionVector },
	gal: { symbol: "gal", factor: new Decimal(0.003785411784), dims: [3, 0, 0, 0, 0, 0, 0] as DimensionVector },
	qt: { symbol: "qt", factor: new Decimal(0.000946352946), dims: [3, 0, 0, 0, 0, 0, 0] as DimensionVector },
	pt: { symbol: "pt", factor: new Decimal(0.000473176473), dims: [3, 0, 0, 0, 0, 0, 0] as DimensionVector },
	cup: { symbol: "cup", factor: new Decimal(0.0002365882365), dims: [3, 0, 0, 0, 0, 0, 0] as DimensionVector },
	fl_oz: { symbol: "fl_oz", factor: new Decimal(0.0000295735295625), dims: [3, 0, 0, 0, 0, 0, 0] as DimensionVector },
	tbsp: { symbol: "tbsp", factor: new Decimal(0.00001478676478125), dims: [3, 0, 0, 0, 0, 0, 0] as DimensionVector },
	tsp: { symbol: "tsp", factor: new Decimal(0.00000492892159375), dims: [3, 0, 0, 0, 0, 0, 0] as DimensionVector },
	// Area (display prefers composite like m^2; avoid shorthand symbols for base squared)
	acre: { symbol: "acre", factor: new Decimal(4046.8564224), dims: [2, 0, 0, 0, 0, 0, 0] as DimensionVector },
	ha: { symbol: "ha", factor: new Decimal(10000), dims: [2, 0, 0, 0, 0, 0, 0] as DimensionVector },
	// Speed
	mph: { symbol: "mph", factor: new Decimal(1609.344).div(3600), dims: [1, 0, -1, 0, 0, 0, 0] as DimensionVector },
	kph: { symbol: "kph", factor: new Decimal(1000).div(3600), dims: [1, 0, -1, 0, 0, 0, 0] as DimensionVector },
	kn: { symbol: "kn", factor: new Decimal(1852).div(3600), dims: [1, 0, -1, 0, 0, 0, 0] as DimensionVector },
	Ma: { symbol: "Ma", factor: new Decimal(340.29), dims: [1, 0, -1, 0, 0, 0, 0] as DimensionVector },
	// Pressure
	atm: { symbol: "atm", factor: new Decimal(101325), dims: [-1, 1, -2, 0, 0, 0, 0] as DimensionVector },
	psi: { symbol: "psi", factor: new Decimal(6894.757293168361), dims: [-1, 1, -2, 0, 0, 0, 0] as DimensionVector },
	Torr: { symbol: "Torr", factor: new Decimal(101325).div(760), dims: [-1, 1, -2, 0, 0, 0, 0] as DimensionVector },
	// Energy & power
	cal: { symbol: "cal", factor: new Decimal(4.184), dims: [2, 1, -2, 0, 0, 0, 0] as DimensionVector },
	kcal: { symbol: "kcal", factor: new Decimal(4184), dims: [2, 1, -2, 0, 0, 0, 0] as DimensionVector },
	hp: { symbol: "hp", factor: new Decimal(745.69987158227022), dims: [2, 1, -3, 0, 0, 0, 0] as DimensionVector },
	// Frequency convenience symbols (prefixes also apply)
	kHz: { symbol: "kHz", factor: new Decimal(1000), dims: [0, 0, -1, 0, 0, 0, 0] as DimensionVector },
	MHz: { symbol: "MHz", factor: new Decimal(1e6), dims: [0, 0, -1, 0, 0, 0, 0] as DimensionVector },
	GHz: { symbol: "GHz", factor: new Decimal(1e9), dims: [0, 0, -1, 0, 0, 0, 0] as DimensionVector },
	// Data (dimensionless)
	B: { symbol: "B", factor: new Decimal(1), dims: ZERO_DIMS },
	kB: { symbol: "kB", factor: new Decimal(1000), dims: ZERO_DIMS },
	MB: { symbol: "MB", factor: new Decimal(1e6), dims: ZERO_DIMS },
	GB: { symbol: "GB", factor: new Decimal(1e9), dims: ZERO_DIMS },
	TB: { symbol: "TB", factor: new Decimal(1e12), dims: ZERO_DIMS },
	PB: { symbol: "PB", factor: new Decimal(1e15), dims: ZERO_DIMS },
	// Logarithmic ratio quantities (dimensionless): neper and decibel (avoid 'B' due to byte)
	Np: { symbol: "Np", factor: new Decimal(1), dims: ZERO_DIMS },
	dB: { symbol: "dB", factor: new Decimal(0.1), dims: ZERO_DIMS },
	// Currency (dimensionless)
	USD: { symbol: "USD", factor: new Decimal(1), dims: ZERO_DIMS },
	EUR: { symbol: "EUR", factor: new Decimal(1), dims: ZERO_DIMS },
	GBP: { symbol: "GBP", factor: new Decimal(1), dims: ZERO_DIMS },
	JPY: { symbol: "JPY", factor: new Decimal(1), dims: ZERO_DIMS },
	// Fun units
	banana: { symbol: "banana", factor: new Decimal(0.2), dims: [1, 0, 0, 0, 0, 0, 0] as DimensionVector },
	olympic_pool: { symbol: "olympic_pool", factor: new Decimal(2500), dims: [3, 0, 0, 0, 0, 0, 0] as DimensionVector },
	football_field: { symbol: "football_field", factor: new Decimal(7140), dims: [2, 0, 0, 0, 0, 0, 0] as DimensionVector },
};

export const UNITS: Readonly<Record<string, UnitDef>> = Object.freeze(UNITS_MUTABLE);

export function resolveUnit(tokenText: string): { factor: Decimal; dims: DimensionVector; symbol: string } | null {
    const lower = tokenText.toLowerCase();

    // Try friendly aliases first if enabled
    if (USE_FRIENDLY_UNIT_ALIASES) {
        const alias = FRIENDLY_UNIT_ALIASES[lower];
        if (alias) {
            const aliased = UNITS[alias];
            if (aliased) return { factor: aliased.factor, dims: aliased.dims, symbol: aliased.symbol };
        }
    }

	// Exact match first
    const direct = UNITS[tokenText];
	if (direct) return { factor: direct.factor, dims: direct.dims, symbol: direct.symbol };

	// Try prefix + base unit (longest prefix first)
	const prefixes = (Object.keys(SI_PREFIXES) as Array<keyof typeof SI_PREFIXES>).sort((a, b) => b.length - a.length);
	for (const prefix of prefixes) {
		if (tokenText.startsWith(prefix)) {
			const base = tokenText.slice(prefix.length);
			const unit = UNITS[base];
			if (unit) return { factor: unit.factor.mul(SI_PREFIXES[prefix]), dims: unit.dims, symbol: tokenText };
		}
	}
	return null;
}

/** Names that should be suggested in autocomplete for units (symbols + friendly aliases). */
export function listUnitAutocompleteNames(): string[] {
    const names = new Set<string>();
    for (const key of Object.keys(UNITS)) names.add(key);
    for (const alias of Object.keys(FRIENDLY_UNIT_ALIASES)) names.add(alias);
    return Array.from(names);
}

export const UNIT_FAMILIES: Record<string, string[]> = {
	length_si: ["mm", "cm", "m", "km"],
    time: ["s", "min", "h", "day", "week"],
	mass: ["g", "kg"],
	angle: ["deg", "rad"],
    volume_si: ["m3", "L", "mL"],
};

export const UNIT_TO_FAMILY: Record<string, keyof typeof UNIT_FAMILIES> = {
	mm: "length_si",
	cm: "length_si",
	m: "length_si",
	km: "length_si",
	s: "time",
	min: "time",
	h: "time",
	hr: "time",
	day: "time",
    week: "time",
	g: "mass",
	kg: "mass",
	deg: "angle",
	rad: "angle",
    m3: "volume_si",
    L: "volume_si",
    mL: "volume_si",
};

export function getUnit(name: string): UnitDef | null {
	return UNITS[name] ?? null;
}

export function pickAutoScaledUnit(lastUnitName: string, valueInBase: Decimal): UnitDef | null {
    const familyKey = UNIT_TO_FAMILY[lastUnitName];
	if (!familyKey) return UNITS[lastUnitName] ?? null;

	const names = UNIT_FAMILIES[familyKey];
	if (!names) return UNITS[lastUnitName] ?? null;
	const candidates = names
		.map(n => ({ name: n, def: UNITS[n] }))
		.filter(x => !!x.def)
		.filter(x => isSIUnit(x.name)) as { name: string; def: UnitDef }[];
	if (candidates.length === 0) return UNITS[lastUnitName] ?? null;

	let best = candidates[0]!;
	let bestScore = new Decimal(Infinity);
	for (const cand of candidates) {
		const valueInUnit = valueInBase.div(cand.def.factor).abs();
		const score = scoreInRange(valueInUnit);
		if (score.lt(bestScore)) {
			best = cand;
			bestScore = score;
		}
	}
	return best.def;
}

function scoreInRange(v: Decimal): Decimal {
	if (v.greaterThanOrEqualTo(1) && v.lessThan(1000)) return new Decimal(0);
	if (v.lessThan(1)) return Decimal.log10(new Decimal(1).div(v)).abs();
	return Decimal.log10(v.div(1000)).abs();
}

function isSIUnit(name: string): boolean {
	switch (name) {
		case "mm":
		case "cm":
		case "m":
		case "km":
		case "g":
		case "kg":
		case "s":
		case "min":
		case "h":
		case "day":
		case "rad":
		case "deg":
			return true;
		default:
			return false;
	}
}


export type UnitDisplayMode = "auto" | "fixed";
export type UserPrefs = {
    time?: { mode: UnitDisplayMode; unit?: string };
    length?: { mode: UnitDisplayMode; unit?: string };
    volume?: { mode: UnitDisplayMode; unit?: string };
};

export function getDisplayUnitAndFactor(args: { dims: DimensionVector; valueInBase?: Decimal; lastUnitName?: string | null; prefs?: UserPrefs }): { unit: string | null; factor: Decimal } {
    const { dims, valueInBase, lastUnitName, prefs } = args;
    // Dimensionless
    if (dimsEqual(dims, ZERO_DIMS)) {
        return { unit: null, factor: new Decimal(1) };
    }

    // If last unit is compatible, prefer it
    if (lastUnitName) {
        const last = UNITS[lastUnitName];
        if (last && dimsEqual(dims, last.dims)) {
            return { unit: last.symbol, factor: last.factor };
        }
    }

    // Preferences: allow fixed unit per family (time/length for now)
    const famKey = ((): keyof typeof UNIT_FAMILIES | null => {
        for (const key of Object.keys(UNIT_FAMILIES) as Array<keyof typeof UNIT_FAMILIES>) {
            const names = UNIT_FAMILIES[key]!;
            const u = UNITS[names[0]!];
            if (u && dimsEqual(dims, u.dims)) return key;
        }
        return null;
    })();

    if (famKey) {
        const pref = ((): { mode: UnitDisplayMode; unit?: string } | null => {
            if (famKey === "time") return prefs?.time ?? null;
            if (famKey === "length_si") return prefs?.length ?? null;
            if (famKey === "volume_si") return prefs?.volume ?? null;
            return null;
        })();

        if (pref && pref.mode === "fixed" && pref.unit) {
            const fixed = UNITS[pref.unit];
            if (fixed && dimsEqual(dims, fixed.dims)) {
                return { unit: fixed.symbol, factor: fixed.factor };
            }
        }

        // Auto mode with scoring based on magnitude if we have a value
        if (pref?.mode !== "fixed" && valueInBase) {
            const names = UNIT_FAMILIES[famKey]!;
            let bestDef: UnitDef | null = null;
            let bestScore: Decimal | null = null;
            for (const name of names) {
                const def = UNITS[name]!;
                if (!def) continue;
                const valueInUnit = valueInBase.div(def.factor).abs();
                const score = scoreInRange(valueInUnit);
                if (!bestDef || (bestScore && score.lt(bestScore)) || bestScore === null) {
                    bestDef = def;
                    bestScore = score;
                }
            }
            if (bestDef) return { unit: bestDef.symbol, factor: bestDef.factor };
        }
    }

    // Try to find a canonical single unit with matching dims
    // Prefer SI base symbols when available (but prefer kg over g for mass)
    const preferredOrder = ["m", "kg", "s", "A", "K", "mol", "cd"] as const;
    for (const sym of preferredOrder) {
        const u = UNITS[sym];
        if (u && dimsEqual(dims, u.dims)) {
            return { unit: u.symbol, factor: u.factor };
        }
    }

    // SI-canonical single-symbols we allow as non-composite fallbacks (keep display SI-first)
    const CANONICAL_DISPLAY: ReadonlySet<string> = new Set([
        // base and common derived
        "m","kg","s","A","K","mol","cd",
        "rad","deg","Hz","N","Pa","J","W","C","V","Ω","Ohm","S","F","H","Wb","T","lm","lx",
    ]);
    for (const key of Object.keys(UNITS)) {
        const u = UNITS[key]!;
        if (!CANONICAL_DISPLAY.has(u.symbol)) continue;
        if (dimsEqual(dims, u.dims)) {
            return { unit: u.symbol, factor: u.factor };
        }
    }

    // Composite unit: format from dims, no scaling (already in base units)
    const formatted = formatUnitFromDims(dims);
    return { unit: formatted, factor: new Decimal(1) };
}