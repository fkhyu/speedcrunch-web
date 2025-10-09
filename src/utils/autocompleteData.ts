// autocompleteData.ts
export interface AutocompleteItem {
  name: string;
  type: "function" | "constant" | "unit" | "operator";
  description: string;
  example?: string;
  hint?: string;
}
import { listUnitAutocompleteNames } from "./units";
import { TOKENISER_FUNCTION_NAMES } from "./tokeniser";
import { CONSTANT_DESCRIPTIONS } from "../utils/constants";

// Static seeds for constants and operators (unit items are generated from registry)
const STATIC_ITEMS: AutocompleteItem[] = [
  // Trigonometric functions
  {
    name: "sin",
    type: "function",
    description: "Sine function",
    example: "sin(45)",
    hint: "sin(angle_in_radians)",
  },
  {
    name: "cos",
    type: "function",
    description: "Cosine function",
    example: "cos(45)",
    hint: "cos(angle_in_radians)",
  },
  {
    name: "tan",
    type: "function",
    description: "Tangent function",
    example: "tan(45)",
    hint: "tan(angle_in_radians)",
  },
  {
    name: "asin",
    type: "function",
    description: "Arcsine function",
    example: "asin(0.5)",
    hint: "asin(value)",
  },
  {
    name: "acos",
    type: "function",
    description: "Arccosine function",
    example: "acos(0.5)",
    hint: "acos(value)",
  },
  {
    name: "atan",
    type: "function",
    description: "Arctangent function",
    example: "atan(1)",
    hint: "atan(value)",
  },
  {
    name: "atan2",
    type: "function",
    description: "Two-argument arctangent",
    example: "atan2(y, x)",
    hint: "atan2(y, x)",
  },

  // Hyperbolic functions
  {
    name: "sinh",
    type: "function",
    description: "Hyperbolic sine",
    example: "sinh(1)",
    hint: "sinh(value)",
  },
  {
    name: "cosh",
    type: "function",
    description: "Hyperbolic cosine",
    example: "cosh(1)",
    hint: "cosh(value)",
  },
  {
    name: "tanh",
    type: "function",
    description: "Hyperbolic tangent",
    example: "tanh(1)",
    hint: "tanh(value)",
  },
  {
    name: "asinh",
    type: "function",
    description: "Inverse hyperbolic sine",
    example: "asinh(1)",
    hint: "asinh(value)",
  },
  {
    name: "acosh",
    type: "function",
    description: "Inverse hyperbolic cosine",
    example: "acosh(2)",
    hint: "acosh(value)",
  },
  {
    name: "atanh",
    type: "function",
    description: "Inverse hyperbolic tangent",
    example: "atanh(0.5)",
    hint: "atanh(value)",
  },

  // Logarithmic functions
  {
    name: "log",
    type: "function",
    description: "Logarithm (base 10 or custom)",
    example: "log(100) or log(2;8)",
    hint: "log(value) or log(base;value)",
  },
  {
    name: "lg",
    type: "function",
    description: "Logarithm base 10",
    example: "lg(100)",
    hint: "lg(value)",
  },
  {
    name: "ln",
    type: "function",
    description: "Natural logarithm",
    example: "ln(e)",
    hint: "ln(value)",
  },

  // Power and root functions
  {
    name: "sqrt",
    type: "function",
    description: "Square root",
    example: "sqrt(16)",
    hint: "sqrt(value)",
  },
  {
    name: "cbrt",
    type: "function",
    description: "Cube root",
    example: "cbrt(27)",
    hint: "cbrt(value)",
  },
  {
    name: "pow",
    type: "function",
    description: "Power function",
    example: "pow(2, 3)",
    hint: "pow(base, exponent)",
  },
  {
    name: "exp",
    type: "function",
    description: "Exponential function (e^x)",
    example: "exp(1)",
    hint: "exp(value)",
  },
  {
    name: "exp2",
    type: "function",
    description: "Base-2 exponential (2^x)",
    example: "exp2(3)",
    hint: "exp2(value)",
  },
  {
    name: "exp10",
    type: "function",
    description: "Base-10 exponential (10^x)",
    example: "exp10(2)",
    hint: "exp10(value)",
  },

  // Rounding functions
  {
    name: "abs",
    type: "function",
    description: "Absolute value",
    example: "abs(-5)",
    hint: "abs(value)",
  },
  {
    name: "floor",
    type: "function",
    description: "Round down to nearest integer",
    example: "floor(3.7)",
    hint: "floor(value)",
  },
  {
    name: "ceil",
    type: "function",
    description: "Round up to nearest integer",
    example: "ceil(3.2)",
    hint: "ceil(value)",
  },
  {
    name: "round",
    type: "function",
    description: "Round to nearest integer",
    example: "round(3.5)",
    hint: "round(value)",
  },
  {
    name: "trunc",
    type: "function",
    description: "Truncate decimal part",
    example: "trunc(3.9)",
    hint: "trunc(value)",
  },

  // Other functions
  {
    name: "min",
    type: "function",
    description: "Minimum of values",
    example: "min(2, 5, 1)",
    hint: "min(value1, value2, ...)",
  },
  {
    name: "max",
    type: "function",
    description: "Maximum of values",
    example: "max(2, 5, 1)",
    hint: "max(value1, value2, ...)",
  },
  {
    name: "factorial",
    type: "function",
    description: "Factorial",
    example: "factorial(5)",
    hint: "factorial(integer)",
  },
  {
    name: "gamma",
    type: "function",
    description: "Gamma function (generalized factorial)",
    example: "gamma(5)  // = 24",
    hint: "gamma(value)",
  },
  {
    name: "lgamma",
    type: "function",
    description: "Natural log of Gamma",
    example: "lgamma(5)",
    hint: "lgamma(value)",
  },

  // Angle conversion
  {
    name: "deg",
    type: "function",
    description: "Convert degrees to radians",
    example: "deg(45)",
    hint: "deg(degrees)",
  },
  {
    name: "rad",
    type: "function",
    description: "Convert radians to degrees",
    example: "rad(pi/4)",
    hint: "rad(radians)",
  },

  // Constants
  {
    name: "π",
    type: "constant",
    description: "Pi constant (≈3.14159)",
    example: "π × 2",
  },
  {
    name: "pi",
    type: "constant",
    description: "Pi constant (≈3.14159)",
    example: "pi × 2",
  },
  {
    name: "e",
    type: "constant",
    description: "Euler's number (≈2.71828)",
    example: "e^2",
  },
  // Additional constants are dynamically generated below

  // Units are generated from registry; no hardcoded unit items here

  // Operators
  {
    name: "×",
    type: "operator",
    description: "Multiplication",
    example: "5 × 3",
  },
  { name: "÷", type: "operator", description: "Division", example: "10 ÷ 2" },
  {
    name: "^",
    type: "operator",
    description: "Exponentiation",
    example: "2^3",
  },
];

function buildUnitItems(): AutocompleteItem[] {
  const names = listUnitAutocompleteNames();
  return names.map((name: string): AutocompleteItem => ({
    name,
    type: "unit" as const,
    description: "Unit",
  }));
}

function buildFunctionItems(): AutocompleteItem[] {
  // Map tokenizer names to human-friendly hints/examples where sensible
  const hintMap: Record<string, string> = {
    sin: "sin(angle)", cos: "cos(angle)", tan: "tan(angle)",
    asin: "asin(value)", acos: "acos(value)", atan: "atan(value)", atan2: "atan2(y, x)",
    log: "log(value) or log(base;value)", log10: "log10(value)", lg: "lg(value)", ln: "ln(value)",
    sqrt: "sqrt(value)", cbrt: "cbrt(value)", root: "root(n; value)", pow: "pow(base; exponent)",
    exp: "exp(value)", exp2: "exp2(value)", exp10: "exp10(value)",
    abs: "abs(value)", floor: "floor(value)", ceil: "ceil(value)", round: "round(value)", trunc: "trunc(value)",
    min: "min(a; b; …)", max: "max(a; b; …)",
    deg: "deg(degrees)", rad: "rad(radians)", factorial: "factorial(n)", gamma: "gamma(x)", lgamma: "lgamma(x)",
  };
  const descMap: Record<string, string> = {
    sin: "Sine", cos: "Cosine", tan: "Tangent",
    asin: "Arcsine", acos: "Arccosine", atan: "Arctangent", atan2: "Two-argument arctangent",
    log: "Logarithm", log10: "Logarithm base 10", lg: "Logarithm base 10", ln: "Natural logarithm",
    sqrt: "Square root", cbrt: "Cube root", root: "Nth root", pow: "Power",
    exp: "Exponential e^x", exp2: "Base-2 exponential", exp10: "Base-10 exponential",
    abs: "Absolute value", floor: "Round down", ceil: "Round up", round: "Round", trunc: "Truncate",
    min: "Minimum", max: "Maximum",
    deg: "Degrees to radians", rad: "Radians to degrees", factorial: "Factorial", gamma: "Gamma function", lgamma: "Log-Gamma",
  };
  // Remove duplicates like both log and log10; keep both but with proper hints
  const names = Array.from(new Set(TOKENISER_FUNCTION_NAMES as readonly string[]));
  return names.map((n): AutocompleteItem => ({
    name: n,
    type: "function" as const,
    description: descMap[n] ?? "Function",
    hint: hintMap[n] ?? "",
  }));
}

function buildConstantItems(): AutocompleteItem[] {
  const names = Object.keys(CONSTANT_DESCRIPTIONS);
  return names.map((n): AutocompleteItem => ({
    name: n,
    type: "constant" as const,
    description: CONSTANT_DESCRIPTIONS[n] ?? "Constant",
  }));
}

const MERGED_AUTOCOMPLETE: AutocompleteItem[] = [
  ...STATIC_ITEMS,
  ...buildFunctionItems(),
  ...buildConstantItems(),
  ...buildUnitItems(),
];

// De-duplicate by (type + name) to avoid duplicate React keys and repeated items
export const AUTOCOMPLETE_DATA: AutocompleteItem[] = (() => {
  const seen = new Set<string>();
  const out: AutocompleteItem[] = [];
  for (const item of MERGED_AUTOCOMPLETE) {
    const key = `${item.type}:${item.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
})();

export function getAutocompleteMatches(
  input: string,
  cursorPosition: number
): AutocompleteItem[] {
  if (!input) return [];

  // Get the word being typed at cursor position
  const beforeCursor = input.substring(0, cursorPosition);
  const words = beforeCursor.split(/[^A-Za-zμ_]/);
  const last = words[words.length - 1];
  const currentWord = (last ? last : "").toLowerCase();

  if (currentWord.length < 1) return [];

  // Filter items that start with the current word
  return AUTOCOMPLETE_DATA.filter((item) =>
    item.name.toLowerCase().startsWith(currentWord)
  ).slice(0, 8); // Limit to 8 suggestions
}

export function getFunctionHint(input: string): string | null {
  // Check for functions without parameters or with incomplete parameters
  const functionPattern =
    /\b(sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|log|lg|ln|sqrt|cbrt|pow|exp|exp2|exp10|abs|floor|ceil|round|trunc|min|max|factorial|gamma|lgamma|deg|rad)\s*\(\s*$/;
  const match = input.match(functionPattern);

  if (match) {
    const functionName = match[1];
    const functionData = AUTOCOMPLETE_DATA.find(
      (item) => item.name === functionName && item.type === "function"
    );
    return functionData?.hint || null;
  }

  return null;
}
