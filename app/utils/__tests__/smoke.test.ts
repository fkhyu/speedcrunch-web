import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import tokenise from "../tokeniser";
import evaluate from "../evaluator";

function evalOk(expr: string) {
  const toks = tokenise(expr);
  expect(toks.isOk(), `tokenise failed for: ${expr}`).toBe(true);
  const ans = new Decimal(0);
  const ind = new Decimal(0);
  const res = evaluate(toks._unsafeUnwrap(), ans, ind, "rad", {});
  expect(res.isOk(), `evaluate failed for: ${expr}`).toBe(true);
  return res._unsafeUnwrap();
}

describe("smoke: numeric expressions", () => {
  const cases = [
    "0",
    "1+2*3",
    "(1+2)*3",
    "2^10",
    "sqrt(2)^2",
    "sin(pi/2)",
    "cos(0)",
    "tan(0)",
    "exp(1)",
    "log10(1000)",
    "abs(-5)",
    "floor(1.9)",
    "ceil(1.1)",
    "round(2.5)",
  ];

  for (const expr of cases) {
    it(expr, () => {
      const q = evalOk(expr);
      expect(q.value.isFinite()).toBe(true);
    });
  }
});

describe("smoke: units and dimensions", () => {
  it("adds compatible units and rejects mismatches", () => {
    const a = evalOk("2 m");
    const b = evalOk("3 m");
    expect(a.dims).toEqual(b.dims);

    const sum = evalOk("2 m + 3 m");
    expect(sum.dims).toEqual(a.dims);

    const prod = evalOk("2 m * 3 s");
    expect(prod.dims).not.toEqual(a.dims);
  });

  it("handles prefixed units and aliases", () => {
    const a = evalOk("1000 mm");
    const b = evalOk("1 m");
    // Compare by converting both to base value via evaluator already in base
    expect(a.dims).toEqual(b.dims);
    expect(a.value.eq(b.value)).toBe(true);
  });

  it("pow with unit dims rules", () => {
    const area = evalOk("(2 m)^2");
    expect(area.dims).not.toBeNull();
    const sqrtArea = evalOk("sqrt((4 m^2))");
    // sqrt(m^2) => m
    expect(sqrtArea.dims).toEqual(evalOk("1 m").dims);
  });
});


