import Decimal from "decimal.js";
import { err, ok, Result } from "neverthrow";
import { match } from "ts-pattern";
import { resolveUnit } from "./units";

// Removed external debug import to make the module self-contained

/**
 * Represents an error where the tokeniser couldn't match the input to any token.
 * The `idx` field points to the start of the unknown part in the input.
 */
export type LexicalError = { type: "UNKNOWN_TOKEN"; idx: number };

/** A tuple of Regex and a token builder function. See {@link tokenMathcers} for details. */
type TokenMatcher = (typeof tokenMatchers)[number];
/** Any of the tokens created by the token builder function in {@link tokenMatchers}. */
type TokenAny = ReturnType<TokenMatcher[1]>;

/**
 * A union of all the possible `Token` `type` values.
 * Automatically computed from `tokenMatchers`.
 * @see {@link tokenMatchers}
 * @see {@link Token}
 */
export type TokenId = ReturnType<TokenMatcher[1]>["type"];

/**
 * A utility type to get the type of a `Token` by type id.
 * @see {@link TokenId} for a comprehensive list of the different token types.
 * @example
 * ```typescript
 * type ConstantToken = Token<"cons">
 * //   ConstantToken = { type: "cons"; name: "pi" | "e" }
 * type FunctionToken = Token<"func">
 * //   FunctionToken = { type: "func"; name: "sin" | "cos" ... }
 * type LeftBrakToken = Token<"lbrk">
 * //   FunctionToken = { type: "lbrk" }
 * ```
 */
export type Token<T extends TokenId = TokenId> = Extract<TokenAny, { type: T }>;

/** Function names recognized by the tokenizer (for autocomplete). */
export const TOKENISER_FUNCTION_NAMES: readonly string[] = [
    "sin","cos","tan","asin","acos","atan","atan2",
    "sinh","cosh","tanh","asinh","acosh","atanh",
    "log10","lg","ln","log",
    "root","sqrt","cbrt","pow","exp","exp2","exp10",
    "abs","floor","ceil","round","trunc","min","max",
    "deg","rad","factorial","gamma","lgamma",
] as const;

/**
 * An array of regex & builder function tuples where
 * - The regex detects a token from the input
 * - The builder builds a token object from the slice that the regex detected
 * @see {@link TokenId}
 * @see {@link Token}
 */
const tokenMatchers = [
	// **Notes:**
	// - Each regex should only try to find its token from the beginning of the string.
	// - When adding new types, remember to mark the `type` property `as const` for TypeScript.

	[
		// Unsigned numeric literal: integers, decimals (with . or ,), leading dot, and scientific notation
		/^(?:((?:\d+[,.]\d+)|(?:[1-9]\d*)|0|(?:[,.]\d+))(?:[eE][+-]?\d+)?)/,
		str => ({
			type: "litr" as const,
			value: new Decimal(str.replace(",", ".")),
		}),
	],
	[
		// Operators: "-", "+", "/", "*", "^", "!"
		// The multiplication and minus signs have unicode variants that also need to be handled
		/^[-+/*^−×!]/,
		(str: string) => ({
			type: "oper" as const,
			name: match(str)
				.with("-", "+", "/", "*", "^", "!", (op: string) => op)
				.with("−", () => "-" as const)
				.with("×", () => "*" as const)
				.otherwise((op: string) => {
					throw Error(`Programmer error: neglected operator "${op}"`);
				}),
		}),
	],
	[
		// Constants: "pi", "e", and unicode variations
		/^(pi|π|e|ℇ|𝑒|ℯ)/i,
		(str: string) => ({
			type: "cons" as const,
			name: match(str.toLowerCase())
				.with("pi", "e", (name: string) => name as "pi" | "e")
				.with("π", () => "pi" as const)
				.with("ℇ", "𝑒", "ℯ", () => "e" as const)
				.otherwise((name: string) => {
					throw Error(`Programmer error: neglected constant "${name}"`);
				}),
		}),
	],
	[
		// Units with optional SI prefix (matched as a single identifier here)
		/^[A-Za-zμ][A-Za-z0-9_]*/,
		(str: string) => {
			const res = resolveUnit(str);
			if (res) {
				return { type: "unit" as const, name: str, factor: res.factor, dims: res.dims };
			}
			// Fall back to known functions if matched here
			const lower = str.toLowerCase();
            if (/(^((a(rc)?)?(sin|cos|tan))$)|^(atan2)$|^(sinh|cosh|tanh|asinh|acosh|atanh)$|^(log|lg|ln)$|^(root|sqrt|√|cbrt|pow|exp|exp2|exp10)$|^(abs|floor|ceil|round|trunc|min|max)$|^factorial$|^(deg|rad)$|^(gamma|lgamma)$/.test(lower)) {
				return {
					type: "func" as const,
					name: match(lower)
                        .with("sqrt", "root", "ln", "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh", "asinh", "acosh", "atanh", "cbrt", "pow", "exp", "exp2", "exp10", "abs", "floor", "ceil", "round", "trunc", "min", "max", "deg", "rad", "gamma", "lgamma", (name: string) => name as any)
						.with("log", "lg", () => "log10" as const)
						.with("√", () => "root" as const)
						.with("arcsin", () => "asin" as const)
						.with("arccos", () => "acos" as const)
						.with("arctan", () => "atan" as const)
						.with("factorial", () => "factorial" as const)
						.otherwise((name: string) => {
							throw Error(`Programmer error: neglected function "${name}"`);
						}),
				};
			}
			return { type: "vari" as const, name: str };
		},
	],
	[
		// Left bracket: "("
		/^\(/,
		() => ({ type: "lbrk" as const }),
	],
	[
		// Right bracket: ")"
		/^\)/,
		() => ({ type: "rbrk" as const }),
	],
	[
		// Argument separators: semicolon ";" or comma ","
		/^[;,]/,
		() => ({ type: "semi" as const }),
	],
	[
		// Memory register: "ans" (answer register), "mem" (independent memory register)
		/^(ans|mem|m|ind)/i,
		(str: string) => ({
			type: "memo" as const,
			name: match(str.toLowerCase())
				.with("ans", () => "ans" as const)
				.with("m", "ind", "mem", () => "ind" as const)
				.otherwise((name: string) => {
					throw Error(`Programmer error: neglected memory register "${name}"`);
				}),
		}),
	],
	[
		// Function name: "sin", "log", "√", etc...
		new RegExp(
			[
				// TODO: Should we also support the "sin^(-1)" notation for arcus functions?
				// TODO: Should we also support the "sin^(2)(x) == sin(x^2)" notation?
				/^((a(rc)?)?(sin|cos|tan))/, 
				/^atan2/,
				/^(sinh|cosh|tanh|asinh|acosh|atanh)/,
				/^(log|lg|ln)/,
				/^(root|sqrt|√|cbrt|pow|exp|exp2|exp10)/,
				/^(abs|floor|ceil|round|trunc|min|max)/,
				/^factorial/,
                /^(deg|rad)/,
                /^(gamma|lgamma)/,
			]
				.map(subRegex => subRegex.source)
				.join("|"),
			"i",
		),
		(str: string) => ({
			type: "func" as const,
			name: match(str.toLowerCase())
                .with("sqrt", "root", "ln", "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh", "asinh", "acosh", "atanh", "cbrt", "pow", "exp", "exp2", "exp10", "abs", "floor", "ceil", "round", "trunc", "min", "max", "deg", "rad", "gamma", "lgamma", (name: string) => name as any)
				.with("log", "lg", () => "log10" as const)
				.with("√", () => "root" as const)
				.with("arcsin", () => "asin" as const)
				.with("arccos", () => "acos" as const)
				.with("arctan", () => "atan" as const)
				.with("factorial", () => "factorial" as const)
				.otherwise((name: string) => {
					throw Error(`Programmer error: neglected function "${name}"`);
				}),
		}),
	],
] satisfies [RegExp, (str: string) => { type: string }][];

/**
 * Reads an input expression and returns a `Result<Token[], LexicalError>` where
 * - `Token[]` is the tokenised expression, or
 * - `LexicalError.idx` is the starting index of the *first lexical error* (i.e. unrecognised word) in the input expression.
 *
 * @see {@link Token}
 * @example
 * ```typescript
 * tokenise("1 + 2") // => Ok([{ type: "litr", value: Decimal(1) }, { type: "oper", name: "+" }, ...])
 * tokenise("1 ö 2") // => Err({ type: "UNKNOWN_TOKEN", idx: 2 }) // 2 === "1 ö 2".indexOf("ö")
 * ```
 */
export default function tokenise(expression: string): Result<Token[], LexicalError> {
    const raw = [...tokens(expression)];
    const combined = Result.combine(raw);
    if (combined.isErr()) return combined;
    const withImul = insertImplicitMultiplication(combined.value);
    return ok(withImul);
}

/**
 * Reads an input expression and returns a `Generator` of `Result<Token, number>` where
 * - `Token` is a token object as built by one of the matchers in {@link tokenMatchers}, or
 * - `number` is the index (of the passed in string) where none of the matchers could be applied,
 *   meaning that there is a lexical error at that point in the input.
 *
 * The generator stops on the first lexical error.
 * I.e. if an error is encountered, it will be the last value output by the generator.
 *
 * @see {@link tokenise}
 * @see {@link Token}
 */
function* tokens(expression: string): Generator<Result<Token, LexicalError>, void, void> {
	const end = expression.length;
	let idx = 0;

	eating: while (idx < end) {
		const slice = expression.slice(idx, end);

		const whitespace = /^\s+/.exec(slice)?.[0];
		if (whitespace) {
			idx += whitespace.length;
			continue eating;
		}

/* Debug input hook removed for production build */

		matching: for (const [regex, build] of tokenMatchers) {
			const str = regex.exec(slice)?.[0];

			if (!str) continue matching;

			const token = build(str) as any;

            idx += str.length;

            // If this looked like a variable but can be fully segmented into known units (e.g., "Ws" -> ["W","s"]),
            // emit the unit tokens back-to-back. Implicit multiplication will be inserted in a later pass.
            if (token && token.type === "vari") {
                const segmented = splitIntoUnitTokens(token.name as string);
                if (segmented) {
                    for (const t of segmented) {
                        yield ok(t as Token);
                    }
                    continue eating;
                }
            }

            yield ok(token as Token);
			continue eating;
		}

		yield err({ type: "UNKNOWN_TOKEN", idx });
		return;
	}
}

/** Inserts implicit multiplication operators between adjacent value-like tokens */
function insertImplicitMultiplication(tokens: Token[]): Token[] {
    const out: Token[] = [];
    for (let i = 0; i < tokens.length; i++) {
        const prev = out[out.length - 1];
        const curr = tokens[i]!;

        const isPrevValue = !!prev && (prev.type === "litr" || prev.type === "cons" || prev.type === "memo" || prev.type === "rbrk" || prev.type === "vari" || prev.type === "unit");
        const isCurrValueOrGroup = curr.type === "litr" || curr.type === "cons" || curr.type === "memo" || curr.type === "lbrk" || curr.type === "vari" || curr.type === "func" || curr.type === "unit";

        if (prev && isPrevValue && isCurrValueOrGroup) {
            // Insert implicit multiplication between value-like tokens
            out.push({ type: "oper", name: "*" } as Extract<Token, { type: "oper" }>);
        }

        out.push(curr);
    }
    return out;
}

/** Greedy left-to-right split of an identifier into known unit tokens if possible; otherwise null */
function splitIntoUnitTokens(identifier: string): Token[] | null {
  const out: Token[] = [];
  let i = 0;
  while (i < identifier.length) {
    let matched: { token: Token; len: number } | null = null;
    // Try longest possible slice from current position
    for (let len = identifier.length - i; len >= 1; len--) {
      const slice = identifier.slice(i, i + len);
      const res = resolveUnit(slice);
      if (res) {
        matched = {
          token: { type: "unit", name: slice, factor: res.factor, dims: res.dims } as any,
          len,
        };
        break;
      }
    }
    if (!matched) return null;
    out.push(matched.token);
    i += matched.len;
  }
  return out.length > 0 ? out : null;
}