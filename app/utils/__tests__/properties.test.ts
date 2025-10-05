import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import tokenise from "../tokeniser";
import evaluate from "../evaluator";

function evalNum(expr: string): Decimal {
  const toks = tokenise(expr);
  if (!toks.isOk()) throw new Error("tokenise failed");
  const res = evaluate(toks._unsafeUnwrap(), new Decimal(0), new Decimal(0), "rad", {});
  if (!res.isOk()) throw new Error("evaluate failed");
  return res._unsafeUnwrap().value;
}

describe("properties: arithmetic identities", () => {
  const nums = ["-10", "-1", "-0.5", "0", "0.5", "1", "2", "10", "1e3", "1e-3"]; 

  it("x + 0 == x and x * 1 == x", () => {
    for (const n of nums) {
      expect(evalNum(`${n} + 0`).toString()).toEqual(evalNum(n).toString());
      expect(evalNum(`${n} * 1`).toString()).toEqual(evalNum(n).toString());
    }
  });

  it("commutativity for + and * on numbers", () => {
    for (const a of nums) for (const b of nums) {
      expect(evalNum(`${a} + ${b}`).toString()).toEqual(evalNum(`${b} + ${a}`).toString());
      expect(evalNum(`${a} * ${b}`).toString()).toEqual(evalNum(`${b} * ${a}`).toString());
    }
  });

  it("associativity for + and * on numbers", () => {
    for (const a of nums) for (const b of nums) for (const c of nums) {
      expect(evalNum(`(${a}+${b})+${c}`).toString()).toEqual(evalNum(`${a}+(${b}+${c})`).toString());
      expect(evalNum(`(${a}*${b})*${c}`).toString()).toEqual(evalNum(`${a}*(${b}*${c})`).toString());
    }
  });
});


