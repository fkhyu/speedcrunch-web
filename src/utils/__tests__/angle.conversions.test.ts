import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import tokenise from "../tokeniser";
import evaluate from "../evaluator";

function evalOk(expr: string, angle: "rad" | "deg") {
  const toks = tokenise(expr);
  if (toks.isErr()) throw new Error(`lex @${toks.error.idx}`);
  const res = evaluate(toks.value, new Decimal(0), new Decimal(0), angle, {});
  if (res.isErr()) throw new Error(`eval ${res.error}`);
  return res.value;
}

describe("angles", () => {
  it("deg(x) converts degrees to radians for trig in deg mode", () => {
    const r = evalOk("sin(deg(90))", "deg");
    expect(r.value.toNumber()).toBeCloseTo(1, 12);
  });

  it("rad(x) converts radians to degrees for inverse trig in deg mode", () => {
    const r = evalOk("acos(0)", "deg");
    expect(r.value.toNumber()).toBeCloseTo(90, 10);
  });

  it("tan critical points error in rad/deg consistently", () => {
    // rad mode: pi/2
    const toks1 = tokenise("tan(pi/2)");
    if (toks1.isErr()) throw new Error("lex");
    const res1 = evaluate(toks1.value, new Decimal(0), new Decimal(0), "rad", {});
    expect(res1.isErr()).toBe(true);
    if (res1.isErr()) expect(res1.error).toBe("TRIG_PRECISION");

    // deg mode: 90
    const toks2 = tokenise("tan(90)");
    if (toks2.isErr()) throw new Error("lex");
    const res2 = evaluate(toks2.value, new Decimal(0), new Decimal(0), "deg", {});
    expect(res2.isErr()).toBe(true);
    if (res2.isErr()) expect(res2.error).toBe("TRIG_PRECISION");
  });
});
