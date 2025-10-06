"use client";

import { useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import tokenise from "../utils/tokeniser";
import evaluate from "../utils/evaluator";
import { getFunctionHint } from "../utils/autocompleteData";
import { DEFAULT_CONSTANTS } from "../utils/constants";
import { chooseDisplayFor, formatResult } from "../utils/display";
import type { Quantity } from "../utils/units";
import type { Token } from "../utils/tokeniser";
import type { UserPrefs } from "../utils/units";

export interface HistoryItem {
  expression: string;
  result: string;
  unit?: string | null;
}

export function useCalculator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string>("");
  const [resultUnit, setResultUnit] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [env, setEnv] = useState<Record<string, Quantity>>({ ...DEFAULT_CONSTANTS });
  const [prefs] = useState<UserPrefs>({ time: { mode: "auto" }, length: { mode: "auto" } });

  useEffect(() => {
    if (!input.trim()) {
      setResult("");
      setResultUnit(null);
      setHint(null);
      return;
    }

    // Built-in command: /clear → clears the history/messages
    const cmdClear = input.trim().match(/^\s*\/clear\s*$/i);
    if (cmdClear) {
      setResult("");
      setResultUnit(null);
      setHint("Clears history");
      return;
    }

    // Built-in command: /const or /const <name>
    const cmdConst = input.trim().match(/^\s*\/const(?:\s+(\w+))?\s*$/i);
    if (cmdConst) {
      const name = cmdConst[1];
      if (!name) {
        setResult(Object.keys(env).sort().join(", "));
        setResultUnit(null);
        setHint("/const <name> to view details");
        return;
      } else {
        const q = (env as any)[name];
        if (q) {
          const tokensRes = tokenise("1");
          if (tokensRes.isOk()) {
            const chosen = chooseDisplayFor(tokensRes.value as Token[], q, prefs);
            setResult(formatResult(chosen.display.toNumber()));
            setResultUnit(chosen.unit);
            setHint(null);
            return;
          }
        }
      }
    }

    const assignMatch = input.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    const exprToEval = assignMatch ? (assignMatch[2] as string) : input;
    const tokensRes = tokenise(exprToEval);
    if (tokensRes.isOk()) {
      const evalRes = evaluate(tokensRes.value as Token[], new Decimal(0), new Decimal(0), "rad", env);
      if (evalRes.isOk()) {
        const baseValue = evalRes.value;
        const chosen = chooseDisplayFor(tokensRes.value as Token[], baseValue, prefs);
        setResult(formatResult(chosen.display.toNumber()));
        setResultUnit(chosen.unit);
        setHint(null);
        return;
      }
    }

    setResult("");
    setResultUnit(null);
    const functionHint = getFunctionHint(input);
    setHint(functionHint);
  }, [input, env, prefs]);

  const handleEnter = useMemo(() => {
    return () => {
      const trimmed = input.trim();
      if (!trimmed) return;

      // Execute /clear command
      if (/^\s*\/clear\s*$/i.test(trimmed)) {
        setHistory([]);
        setResult("");
        setResultUnit(null);
        setHint(null);
        setInput("");
        return;
      }

      const assignMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const name = assignMatch[1] as string;
        const rhs = assignMatch[2] as string;
        const tokensRes = tokenise(rhs);
        if (tokensRes.isOk()) {
          const evalRes = evaluate(tokensRes.value as Token[], new Decimal(0), new Decimal(0), "rad", env);
          if (evalRes.isOk()) {
            const value = evalRes.value;
            setEnv(prev => ({ ...prev, [name]: value }));
            const chosen = chooseDisplayFor(tokensRes.value as Token[], value, prefs);
            const formattedResult = formatResult(chosen.display.toNumber());
            const unitName = chosen.unit;
            const newHistoryItem: HistoryItem = { expression: `${name} = ${rhs}`, result: formattedResult, unit: unitName };
            setHistory(prev => [...prev, newHistoryItem]);
            setInput("");
            return;
          }
        }
      }

      if (result) {
        const newHistoryItem: HistoryItem = { expression: trimmed, result: result, unit: resultUnit };
        setHistory(prev => [...prev, newHistoryItem]);
        setInput("");
      }
    };
  }, [input, env, prefs, result, resultUnit]);

  return {
    input,
    setInput,
    result,
    resultUnit,
    hint,
    history,
    handleEnter,
  } as const;
}