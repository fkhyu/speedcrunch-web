import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import tokenise from "../tokeniser";
import evaluate from "../evaluator";

function evalErr(expr: string) {
  const toks = tokenise(expr);
  if (toks.isErr()) return { kind: "lex", msg: `lex @${toks.error.idx}` } as const;
  const res = evaluate(toks.value, new Decimal(0), new Decimal(0), "rad", {});
  if (res.isOk()) return { kind: "ok" as const };
  return { kind: "eval", err: res.error } as const;
}

describe("evaluator errors", () => {
  it("dimension mismatch on add/sub", () => {
    const a = evalErr("1 m + 1 s");
    expect(a.kind).toBe("eval");
    expect((a as any).err).toBe("DIMENSION_MISMATCH");

    const b = evalErr("2 - 1 m");
    expect(b.kind).toBe("eval");
    expect((b as any).err).toBe("DIMENSION_MISMATCH");
  });

  it("bad unit power for fractional incompatible exponent", () => {
    const r = evalErr("(2 m) ^ 0.5");
    expect(r.kind).toBe("eval");
    expect((r as any).err).toBe("BAD_UNIT_POWER");
  });

  it("trig precision near tan(π/2)", () => {
    const t = evalErr("tan(pi/2)");
    expect(t.kind).toBe("eval");
    expect((t as any).err).toBe("TRIG_PRECISION");
  });

  it("unexpected token / syntax", () => {
    const s = evalErr("1 +");
    expect(s.kind).toBe("eval");
    expect((s as any).err).toBe("UNEXPECTED_EOF");

    const s2 = evalErr("(1+2");
    expect(s2.kind).toBe("eval");
    expect((s2 as any).err).toBe("NO_RHS_BRACKET");
  });
});
