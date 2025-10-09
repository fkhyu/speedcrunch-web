import { describe, it, expect } from "vitest";
import tokenise from "../tokeniser";

function toks(expr: string) {
  const r = tokenise(expr);
  if (r.isErr()) throw new Error(`lex fail @${r.error.idx}`);
  return r.value as any[];
}

describe("tokeniser behavior", () => {
  it("inserts implicit multiplication between literals, consts, funcs, vars, units", () => {
    const ts = toks("2m(3)pi x");
    // Expect: 2 * m * ( 3 ) * pi * x  (with '*' inserted)
    const ops = ts.filter(t => t.type === "oper" && t.name === "*");
    expect(ops.length).toBeGreaterThanOrEqual(4);
  });

  it("segments identifiers into unit tokens when fully resolvable (e.g., Ws)", () => {
    const ts = toks("1 Ws");
    const unitSeq = ts.filter(t => t.type === "unit").map((t: any) => t.name);
    // Should split into ["W","s"] or resolve directly as "Ws" if present; allow either
    if (unitSeq.length === 1) {
      expect(["Ws", "J/s*s"].includes(unitSeq[0])).toBeTruthy();
    } else {
      expect(unitSeq).toContain("W");
      expect(unitSeq).toContain("s");
    }
  });
});
