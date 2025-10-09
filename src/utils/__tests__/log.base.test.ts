import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import tokenise from "../tokeniser";
import evaluate from "../evaluator";

function evalOk(expr: string) {
  const toks = tokenise(expr);
  if (toks.isErr()) throw new Error(`lex @${toks.error.idx}`);
  const res = evaluate(toks.value, new Decimal(0), new Decimal(0), "rad", {});
  if (res.isErr()) throw new Error(`eval ${res.error}`);
  return res.value.value.toNumber();
}

describe("log base", () => {
  it("ln is natural log", () => {
    const n = evalOk("ln(e)");
    expect(n).toBeCloseTo(1, 12);
  });

  it("log10 is base-10 log (1-arg)", () => {
    const n = evalOk("log10(1000)");
    expect(n).toBeCloseTo(3, 12);
  });

  it("log as change of base when given 2 args (base;value)", () => {
    const n = evalOk("log10(2; 100)");
    // log base 2 of 100 ~ 6.6438
    expect(n).toBeCloseTo(6.64385618977, 6);
  });
});
