import Decimal from "decimal.js";
import { err, ok, Ok, Result } from "neverthrow";
import { isMatching, match, P, Pattern } from "ts-pattern";
import { Quantity, makeScalar, add as qAdd, sub as qSub, multiply as qMul, divide as qDiv, pow as qPow, isDimensionless } from "./units";

type AngleUnit = "rad" | "deg";
import { Token } from "./tokeniser";
import { debug } from "./debug";
Decimal.set({ precision: 500 });
const PI = Decimal.acos(-1);
const E = Decimal.exp(1);
const ONE = new Decimal(1);
const TWO = new Decimal(2);
const RAD_DEG_RATIO = new Decimal(180).div(PI);
const TAN_PRECISION = new Decimal(1).div(1_000_000_000);

function factorialDecimal(n: Decimal): Decimal {
    // Assumes n is a non-negative integer
    let acc = new Decimal(1);
    const limit = n.toNumber();
    for (let i = 2; i <= limit; i++) {
        acc = acc.mul(i);
    }
    return acc;
}

// Lanczos approximation for Gamma function for Decimal
// Returns gamma(z) for dimensionless Decimal z (limited precision by Decimal math)
function gammaDecimal(z: Decimal): Decimal {
    // Reflection formula for negative non-integers: Γ(z)Γ(1−z) = π / sin(πz)
    if (z.isNeg() && !z.isInteger()) {
        const piZ = PI.mul(z);
        const sinPiZ = new Decimal(Math.sin(piZ.toNumber()));
        const oneMinusZ = ONE.sub(z);
        return PI.div(sinPiZ).div(gammaDecimal(oneMinusZ));
    }

    // Shift up for small z to improve stability
    let x = z;
    let shift = 0;
    while (x.lt(ONE)) {
        x = x.add(ONE);
        shift++;
    }

    // Lanczos parameters (g=7, n=9) coefficients for approximation
    const g = 7;
    const p = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7,
    ];

    let a = new Decimal(p[0]!);
    for (let i = 1; i < p.length; i++) {
        a = a.add(new Decimal(p[i]!).div(x.add(i - 1)));
    }

    const t = x.add(g - 0.5);
    // Γ(x) ≈ √(2π) a t^{x-0.5} e^{-t}
    const sqrtTwoPi = new Decimal(Math.sqrt(2 * Math.PI));
    let gammaX = sqrtTwoPi.mul(a).mul(t.pow(x.sub(0.5))).mul(Decimal.exp(t.neg()));

    // Undo shifts: Γ(z) = Γ(x) / [(z)(z+1)...(x-1)] for x=z+shift
    for (let k = 0; k < shift; k++) {
        gammaX = gammaX.div(z.add(k));
    }
    return gammaX;
}

// Log Gamma using Gamma and ln
function lgammaDecimal(z: Decimal): Decimal {
    const g = gammaDecimal(z);
    const ln = (Decimal as any).ln as (d: Decimal) => Decimal;
    return ln(g);
}

export type EvalResult = Result<Quantity, EvalErrorId>;
export type UserFunction = { params: string[]; body: Token[] };
export type EvalEnv = Record<string, Quantity | UserFunction>;
export type EvalErrorId =
	| "UNEXPECTED_EOF"
	| "UNEXPECTED_TOKEN"
	| "NOT_A_NUMBER"
	| "INFINITY"
	| "NO_LHS_BRACKET"
	| "NO_RHS_BRACKET"
	| "NOT_ENOUGH_ARGS"
	| "TOO_MANY_ARGS"
	| "TRIG_PRECISION"
	| "DIMENSION_MISMATCH"
	| "BAD_UNIT_POWER";

/**
 * Parses and evaluates a mathematical expression as a list of `Token`s into a `Decimal` value.
 *
 * The returned `Result` is either
 * - The value of the given expression as a `Decimal` object, or
 * - A string representing a syntax error in the input
 *
 */
export default function evaluate(tokens: Token[], ans: Decimal, ind: Decimal, angleUnit: AngleUnit, env: EvalEnv = {}): EvalResult {
    if (debug.isEnabled()) debug.trace("eval.start", { len: tokens.length, angleUnit, envKeys: Object.keys(env) });
	// This function is an otherwise stock-standard Pratt parser but instead
	// of building a full AST as the `left` value, we instead eagerly evaluate
	// the sub-expressions in the `led` parselets.
	//
	// If the above is gibberish to you, it's recommended to read up on Pratt parsing before
	// attempting to change this algorithm. Good explainers are e.g. (WayBackMachine archived):
	// - https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/ (https://u.ri.fi/1n)
	// - https://martin.janiczek.cz/2023/07/03/demystifying-pratt-parsers.html (https://u.ri.fi/1o)
	// - https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html (https://u.ri.fi/1p)
	// - https://abarker.github.io/typped/pratt_parsing_intro.html (https://u.ri.fi/1q)

	let idx = -1; // Incremented by the first `next()` call into the valid index zero

	/** Consumes the next token from the input and returns it */
	function next() {
		return tokens[++idx];
	}

	/** Peeks at the next unconsumed token in the input */
	function peek() {
		return tokens[idx + 1];
	}

	/**
	 * Accepts a `Pattern` for a token and returns it as a `Result`.
	 * - The result is `Ok` with the next token wrapped if the next token matches the pattern.
	 * - The result is `Err` if the next token does not match the pattern.
	 *
	 * Can either just peek at the next token or consume it, based on the value of the second argument.
	 */
	function expect(pattern: Pattern.Pattern<any>): Result<Token, EvalErrorId> {
		const token = peek();

		if (!token) return err("UNEXPECTED_EOF");
		if (!(isMatching as any)(pattern, token as Token)) return err("UNEXPECTED_TOKEN");

		const consumed = next();

		return ok(consumed as Token);
	}

	/**
	 * The null denotation of a token.
	 * Also known as the "prefix" or "head" handler.
	 *
	 * Returns the value of a sub-expression without a preceding (i.e. left) expression (i.e. value).
	 */
    function nud(token: Token | undefined): EvalResult {
        if (debug.isEnabled()) debug.trace("eval.nud", token);
		return match(token)
			.with(undefined, () => err("UNEXPECTED_EOF" as const))
            .with({ type: "litr" }, token => ok(makeScalar(token.value)))
            .with({ type: "unit" }, token => ok({ value: token.factor, dims: token.dims }))
            .with({ type: "cons", name: "pi" }, () => ok(makeScalar(PI)))
            .with({ type: "cons", name: "e" }, () => ok(makeScalar(E)))
            .with({ type: "memo", name: "ans" }, () => ok(makeScalar(ans)))
            .with({ type: "memo", name: "ind" }, () => ok(makeScalar(ind)))
            .with({ type: "vari" }, token => {
                const found = env[token.name];
                if (!found || (found as any).body) return err("UNEXPECTED_TOKEN");
                return ok(found as Quantity);
            })
            .with({ type: "oper", name: "-" }, () => evalExpr(3).map(right => ({ value: right.value.neg(), dims: right.dims })))
			.with({ type: "lbrk" }, () =>
				evalExpr(0).andThen(value =>
					expect({ type: "rbrk" })
						.map(() => value)
						.mapErr(() => "NO_RHS_BRACKET" as const),
				),
			)
            .with({ type: "func" }, token =>
                evalArgs().andThen(args => {
                    if (debug.isEnabled()) debug.trace("eval.funcCall", { name: token.name, argc: args.length });
                    // First: user-defined functions from env
                    const maybeFn = env[token.name] as UserFunction | undefined;
                    if (maybeFn && (maybeFn as any).body) {
                        if (debug.isEnabled()) debug.trace("eval.userFunc", { name: token.name, params: maybeFn.params });
                        const { params, body } = maybeFn;
                        if (args.length !== params.length) return err(args.length < params.length ? "NOT_ENOUGH_ARGS" as const : "TOO_MANY_ARGS" as const);
                        // Build child env with arguments bound to parameter names
                        const childEnv: EvalEnv = { ...env };
                        for (let i = 0; i < params.length; i++) {
                            childEnv[params[i]!] = args[i]!;
                        }
                        const res = evaluate(body, ans, ind, angleUnit, childEnv);
                        if (debug.isEnabled()) debug.trace("eval.userFunc.result", res.isOk() ? { ok: (res.value as any).value?.toString() } : { err: (res as any).error });
                        return res;
                    }

                    return match(token.name)
						.with("root", () => {
							if (args.length < 1) return err("NOT_ENOUGH_ARGS" as const);
							if (args.length > 2) return err("TOO_MANY_ARGS" as const);
                            const radicand = args[0]!;
                            const degree = args[1]?.value ?? TWO;
                            if (degree.eq(0)) {
								return err("NOT_A_NUMBER" as const);
							}
                            // Quantity root via power
                            return ok(qPow(radicand, ONE.div(degree)));
						})
						.with("cbrt", () => {
							if (args.length !== 1) return err(args.length < 1 ? "NOT_ENOUGH_ARGS" as const : "TOO_MANY_ARGS" as const);
							return ok(qPow(args[0]!, new Decimal(1).div(3)));
						})
						.with("pow", () => {
							if (args.length !== 2) return err(args.length < 2 ? "NOT_ENOUGH_ARGS" as const : "TOO_MANY_ARGS" as const);
							const base = args[0]!;
							const exponent = args[1]!;
							if (!isDimensionless(exponent)) return err("DIMENSION_MISMATCH" as const);
							try { return ok(qPow(base, exponent.value)); } catch { return err("BAD_UNIT_POWER" as const); }
						})
						.with("atan2", () => {
							if (args.length !== 2) return err(args.length < 2 ? "NOT_ENOUGH_ARGS" as const : "TOO_MANY_ARGS" as const);
							const y = args[0]!; const x = args[1]!;
							if (!isDimensionless(y) || !isDimensionless(x)) return err("DIMENSION_MISMATCH" as const);
							const ang = new Decimal(Math.atan2(y.value.toNumber(), x.value.toNumber()));
							return angleUnit === "deg" ? ok(makeScalar(radToDeg(ang))) : ok(makeScalar(ang));
						})
						.with("min", () => {
							if (args.length < 1) return err("NOT_ENOUGH_ARGS" as const);
							const first = args[0]!;
							let best = first;
							for (let i = 1; i < args.length; i++) {
								const a = args[i]!;
								try {
									// Reuse add check for dims via throw in ops, or compare dims manually
									if (best.dims.some((d, idx) => d !== a.dims[idx])) return err("DIMENSION_MISMATCH" as const);
								} catch {
									return err("DIMENSION_MISMATCH" as const);
								}
								if (a.value.lt(best.value)) best = a;
							}
							return ok(best);
						})
						.with("max", () => {
							if (args.length < 1) return err("NOT_ENOUGH_ARGS" as const);
							const first = args[0]!;
							let best = first;
							for (let i = 1; i < args.length; i++) {
								const a = args[i]!;
								if (best.dims.some((d, idx) => d !== a.dims[idx])) return err("DIMENSION_MISMATCH" as const);
								if (a.value.gt(best.value)) best = a;
							}
							return ok(best);
						})
						.with("deg", () => {
							if (args.length !== 1) return err(args.length < 1 ? "NOT_ENOUGH_ARGS" as const : "TOO_MANY_ARGS" as const);
							const a = args[0]!; if (!isDimensionless(a)) return err("DIMENSION_MISMATCH" as const);
							return ok(makeScalar(degToRad(a.value)));
						})
						.with("rad", () => {
							if (args.length !== 1) return err(args.length < 1 ? "NOT_ENOUGH_ARGS" as const : "TOO_MANY_ARGS" as const);
							const a = args[0]!; if (!isDimensionless(a)) return err("DIMENSION_MISMATCH" as const);
							return ok(makeScalar(radToDeg(a.value)));
						})
						.with("factorial", () => {
							if (args.length < 1) return err("NOT_ENOUGH_ARGS" as const);
							if (args.length > 1) return err("TOO_MANY_ARGS" as const);
							const arg = args[0]!;
							if (!isDimensionless(arg)) return err("DIMENSION_MISMATCH");
							const n = arg.value;
							if (!n.isInteger() || n.isNeg()) return err("NOT_A_NUMBER");
							return ok(makeScalar(factorialDecimal(n)));
						})
                        .with("gamma", () => {
                            if (args.length !== 1) return err(args.length < 1 ? "NOT_ENOUGH_ARGS" as const : "TOO_MANY_ARGS" as const);
                            const a = args[0]!; if (!isDimensionless(a)) return err("DIMENSION_MISMATCH" as const);
                            return ok(makeScalar(gammaDecimal(a.value)));
                        })
                        .with("lgamma", () => {
                            if (args.length !== 1) return err(args.length < 1 ? "NOT_ENOUGH_ARGS" as const : "TOO_MANY_ARGS" as const);
                            const a = args[0]!; if (!isDimensionless(a)) return err("DIMENSION_MISMATCH" as const);
                            return ok(makeScalar(lgammaDecimal(a.value)));
                        })
                        .otherwise(funcName => {
							if (args.length < 1) return err("NOT_ENOUGH_ARGS" as const);
							// Special-case log10 as log with optional base: log(base;value)
							if (funcName === "log10" && args.length === 2) {
								const base = args[0]!; const val = args[1]!;
								if (!isDimensionless(base) || !isDimensionless(val)) return err("DIMENSION_MISMATCH" as const);
								const ln = (x: Decimal) => (Decimal as any).ln(x) as Decimal;
								return ok(makeScalar(ln(val.value).div(ln(base.value))));
							}
							if (args.length > 1) return err("TOO_MANY_ARGS" as const);
							const func = (Decimal as any)[funcName]?.bind(Decimal) ?? null;
							const arg = args[0]!;
							// Functions require dimensionless args
							if (!isDimensionless(arg)) return err("DIMENSION_MISMATCH");

                            // Handle trig angle-unit conversions and other Decimal functions
                            if (angleUnit === "deg" && (funcName === "sin" || funcName === "cos")) {
                                return ok(makeScalar(func(degToRad(arg.value))));
                            }
                            if (angleUnit === "deg" && (funcName === "asin" || funcName === "acos" || funcName === "atan")) {
                                return ok(makeScalar(radToDeg(func(arg.value))));
                            }
                            if (funcName === "tan") {
                                const argInRads = angleUnit === "deg" ? degToRad(arg.value) : arg.value;
                                const coefficient = argInRads.sub(PI.div(2)).div(PI);
                                const distFromCriticalPoint = coefficient.sub(coefficient.round()).abs();
                                const isArgCritical = distFromCriticalPoint.lt(TAN_PRECISION);
                                if (isArgCritical) return err("TRIG_PRECISION" as const);
                                return ok(makeScalar(func(argInRads)));
                            }
                            if (["sinh","cosh","tanh","asinh","acosh","atanh","sqrt","cbrt","exp"].includes(funcName)) {
                                return ok(makeScalar(func(arg.value)));
                            }
                            if (funcName === "exp2") {
                                return ok(makeScalar(new Decimal(2).pow(arg.value)));
                            }
                            if (funcName === "exp10") {
                                return ok(makeScalar(new Decimal(10).pow(arg.value)));
                            }
                            if (["abs","floor","ceil","round","trunc"].includes(funcName)) {
                                return ok(makeScalar(func(arg.value)));
                            }
                            return ok(makeScalar(func ? func(arg.value) : arg.value));
                        });
                }),
			)
			.otherwise(() => err("UNEXPECTED_TOKEN"));
	}

	/**
	 * The left denotation of a token.
	 * Also known as the "infix" or "tail" handler.
	 *
	 * Returns the value of a sub-expression with a preceding (i.e. left) expression (i.e. value).
	 */
    function led(token: Token | undefined, left: Ok<Quantity, EvalErrorId>): EvalResult {
        if (debug.isEnabled()) debug.trace("eval.led", token);
		return (
			match(token)
				.with(undefined, () => err("UNEXPECTED_EOF" as const))
				.with({ type: "oper", name: "!" }, () => {
					// Postfix factorial, highest precedence (handled without consuming rhs)
					const q = left.value;
					if (!isDimensionless(q)) return err("DIMENSION_MISMATCH" as const);
					const n = q.value;
					if (!n.isInteger() || n.isNeg()) return err("NOT_A_NUMBER" as const);
					return ok(makeScalar(factorialDecimal(n)));
				})
				.with({ type: "oper", name: "+" }, () =>
					evalExpr(2).andThen(right => {
						try {
							return ok(qAdd(left.value, right));
						} catch {
							return err("DIMENSION_MISMATCH" as const);
						}
					}),
				)
				.with({ type: "oper", name: "-" }, () =>
					evalExpr(2).andThen(right => {
						try {
							return ok(qSub(left.value, right));
						} catch {
							return err("DIMENSION_MISMATCH" as const);
						}
					}),
				)
				.with({ type: "oper", name: "*" }, () =>
					evalExpr(3).andThen(right => ok(qMul(left.value, right))),
				)
				.with({ type: "oper", name: "/" }, () =>
					evalExpr(3).andThen(right => ok(qDiv(left.value, right))),
				)
				.with({ type: "oper", name: "^" }, () =>
					evalExpr(3).andThen(right => {
						try {
							return ok(qPow(left.value, right.value));
						} catch {
							return err("BAD_UNIT_POWER" as const);
						}
					}),
				)
				// Right bracket should never get parsed by anything else than the left bracket parselet
				.with({ type: "rbrk" }, () => err("NO_LHS_BRACKET" as const))
				.otherwise(() => err("UNEXPECTED_TOKEN"))
		);
	}

	/**
	 * Tries to read the arguments of a function call to a list of `Decimal`s.
	 */
    function evalArgs(): Result<Quantity[], EvalErrorId> {
		return expect({ type: "lbrk" }).andThen(() => {
            const out: EvalResult[] = [];

			do {
				out.push(evalExpr(0));
			} while (expect({ type: "semi" }).isOk());

            return expect({ type: "rbrk" }).andThen(() => Result.combine(out));
		});
	}

    function evalExpr(rbp: number): EvalResult {
		let left = nud(next());

		while (left.isOk() && peek() && lbp(peek()!) > rbp) {
			left = led(next(), left);
		}

		return left;
	}

    const result = evalExpr(0);

	// After the root eval call there shouldn't be anything to peek at
    if (peek()) {
        if (debug.isEnabled()) debug.trace("eval.end.err", "UNEXPECTED_TOKEN");
        return err("UNEXPECTED_TOKEN");
    } else if (result.isErr()) {
        if (debug.isEnabled()) debug.trace("eval.end.err", (result as any).error);
        return result;
    } else if (result.value?.value?.isNaN()) {
        if (debug.isEnabled()) debug.trace("eval.end.err", "NOT_A_NUMBER");
        return err("NOT_A_NUMBER");
    } else if (!result.value?.value?.isFinite()) {
        if (debug.isEnabled()) debug.trace("eval.end.err", "INFINITY");
        return err("INFINITY");
	} else {
        if (debug.isEnabled()) debug.trace("eval.end.ok", { value: result.value.value.toString(), dims: result.value.dims });
		return result;
	}
}

/** Returns the Left Binding Power of the given token */
function lbp(token: Token) {
    return match(token)
        .with({ type: P.union("lbrk", "rbrk", "semi") }, () => 0)
        .with({ type: P.union("litr", "memo", "cons", "vari", "unit") }, () => 1)
        .with({ type: "oper", name: P.union("+", "-") }, () => 2)
        .with({ type: "oper", name: P.union("*", "/") }, () => 3)
        .with({ type: "oper", name: "^" }, () => 4)
        .with({ type: "oper", name: "!" }, () => 6)
        .with({ type: "func" }, () => 5)
        .otherwise(() => 0);
}

/** Converts the argument from degrees to radians */
function degToRad(deg: Decimal) {
    return deg.div(RAD_DEG_RATIO);
}

/** Converts the argument from radians to degrees */
function radToDeg(rad: Decimal) {
    return rad.mul(RAD_DEG_RATIO);
}
