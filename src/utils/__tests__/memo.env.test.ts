import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import tokenise from "../tokeniser";
import evaluate from "../evaluator";
import { makeScalar } from "../units";

function evalWith(ans: number, ind: number, expr: string) {
  const toks = tokenise(expr);
  if (toks.isErr()) throw new Error(`lex @${toks.error.idx}`);
  const res = evaluate(
    toks.value,
    new Decimal(ans),
    new Decimal(ind),
    "rad",
    { x: makeScalar(new Decimal(7)) }
  );
  if (res.isErr()) throw new Error(`eval ${res.error}`);
  return res.value;
}

describe("memory and env", () => {
  it("ans and ind registers work", () => {
    expect(evalWith(10, 3, "ans").value.toNumber()).toBe(10);
    expect(evalWith(10, 3, "ind").value.toNumber()).toBe(3);
  });

  it("variables from env are used and must be referenced directly", () => {
    const r = evalWith(0, 0, "x + 1");
    expect(r.value.toNumber()).toBe(8);
  });

  it("unknown variable yields syntax error", () => {
    const t = tokenise("y+1");
    if (t.isErr()) throw new Error("lex");
    const r = evaluate(t.value, new Decimal(0), new Decimal(0), "rad", {});
    expect(r.isErr()).toBe(true);
    if (r.isErr()) expect(r.error).toBe("UNEXPECTED_TOKEN");
  });
});
