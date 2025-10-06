"use client";

import { useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import tokenise from "../utils/tokeniser";
import evaluate from "../utils/evaluator";
import { getFunctionHint } from "../utils/autocompleteData";
import { DEFAULT_CONSTANTS } from "../utils/constants";
import { chooseDisplayFor, formatResult } from "../utils/display";
import { debug as DebugBus } from "../utils/debug";
import { UNIT_FAMILIES, UNITS, dimsEqual } from "../utils/units";
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
  const [env, setEnv] = useState<Record<string, any>>({ ...DEFAULT_CONSTANTS });
  const [prefs, setPrefs] = useState<UserPrefs>({ global: { siBaseMode: "si", showDerivedAnnotations: false }, time: { mode: "auto" }, length: { mode: "auto" } });
  const [debug, setDebug] = useState<boolean>(false);
  const [angle, setAngle] = useState<"rad" | "deg">("rad");
  const [smartIds, setSmartIds] = useState<boolean>(false);
  const [ans, setAns] = useState<Decimal>(new Decimal(0));
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // -1 means not navigating

  const formatTokens = (toks: Token[]) =>
    toks
      .map(t =>
        (t as any).type === "litr"
          ? `litr(${(t as any).value.toString()})`
          : (t as any).type === "oper"
          ? `oper(${(t as any).name})`
          : (t as any).type === "func"
          ? `func(${(t as any).name})`
          : (t as any).type === "vari"
          ? `vari(${(t as any).name})`
          : (t as any).type === "unit"
          ? `unit(${(t as any).name})`
          : (t as any).type
      )
      .join(" ");

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

    // Preview expression or assignment
    // Debug command
    const cmdDebug = input.trim().match(/^\s*\/debug\s+(on|off)\s*$/i);
    if (cmdDebug) {
      const onoff = (cmdDebug[1] as string).toLowerCase();
      setDebug(onoff === "on");
      DebugBus.setEnabled(onoff === "on");
      const msg = onoff === "on" ? "Debug enabled" : "Debug disabled";
      setHint(msg);
      setResult(msg);
      setResultUnit(null);
      return;
    }

    // Angle unit command (live): /angle rad|deg
    const cmdAngle = input.trim().match(/^\s*\/angle\s+(rad|deg)\s*$/i);
    // Toggle env-based identifier splitting (live): /smartids on|off
    const cmdSmartIds = input.trim().match(/^\s*\/smartids\s+(on|off)\s*$/i);
    if (cmdSmartIds) {
      const onoff = (cmdSmartIds[1] as string).toLowerCase();
      const next = onoff === "on";
      const msg = next ? "Smart identifier splitting ON" : "Smart identifier splitting OFF";
      setHint(msg);
      setResult(msg);
      setResultUnit(null);
      return;
    }
    if (cmdAngle) {
      const next = (cmdAngle[1] as string).toLowerCase() as "rad" | "deg";
      setAngle(next);
      const msg = `Angle set to ${next}`;
      setHint(msg);
      setResult(msg);
      setResultUnit(null);
      return;
    }

    // SI display mode (live preview): /si on|off
    const cmdSi = input.trim().match(/^\s*\/si\s+(on|off)\s*$/i);
    if (cmdSi) {
      const onoff = (cmdSi[1] as string).toLowerCase();
      const msg = onoff === "on" ? "SI base units on" : "SI base units auto";
      setHint(msg);
      setResult(msg);
      setResultUnit(null);
      return;
    }

    // Unit preference (live preview): /unit <family> <unit|auto>
    const cmdUnit = input.trim().match(/^\s*\/unit\s+(\w+)\s+(\w+)\s*$/i);
    if (cmdUnit) {
      const family = (cmdUnit[1] as string).toLowerCase();
      const value = (cmdUnit[2] as string).toLowerCase();
      const famLabel = family === "length" ? "length" : family === "time" ? "time" : family === "volume" ? "volume" : family;
      const msg = value === "auto" ? `${famLabel} display set to auto` : `${famLabel} fixed to ${value}`;
      setHint(msg);
      setResult(msg);
      setResultUnit(null);
      return;
    }

    // Unit options (live): /unit or /unit <family> or /unit global
    const cmdUnitListAll = input.trim().match(/^\s*\/unit\s*$/i);
    if (cmdUnitListAll) {
      const families = ["global", "time", "length", "volume"];
      const msg = `Families: ${families.join(", ")}. Usage: /unit <family> <unit|auto>. Global: /unit global si|auto|derived on|off`;
      setHint(msg);
      setResult(msg);
      setResultUnit(null);
      return;
    }
    const cmdUnitListGlobal = input.trim().match(/^\s*\/unit\s+global\s*$/i);
    if (cmdUnitListGlobal) {
      const nowSi = prefs.global?.siBaseMode ?? "auto";
      const nowDer = (prefs.global?.showDerivedAnnotations ?? false) ? "on" : "off";
      const msg = `global modes: si, auto (current: ${nowSi}); derived annotations: on|off (current: ${nowDer}). Use: /unit global si|auto|derived on|off`;
      setHint(msg);
      setResult(msg);
      setResultUnit(null);
      return;
    }
    const cmdUnitListFam = input.trim().match(/^\s*\/unit\s+(\w+)\s*$/i);
    if (cmdUnitListFam) {
      const famUi = (cmdUnitListFam[1] as string).toLowerCase();
      const famKey = famUi === "length" ? "length_si" : famUi === "volume" ? "volume_si" : famUi === "time" ? "time" : null;
      if (famKey && (UNIT_FAMILIES as any)[famKey]) {
        const rep = (UNIT_FAMILIES as any)[famKey][0] as string;
        const repDef = (UNITS as any)[rep];
        if (repDef) {
          const all = Object.keys(UNITS).filter((k) => {
            const u = (UNITS as any)[k];
            return u && dimsEqual(u.dims, repDef.dims);
          }).sort();
          const msg = `${famUi} units: ${all.join(", ")}. Use: /unit ${famUi} <unit|auto>`;
          setHint(msg);
          setResult(msg);
          setResultUnit(null);
          return;
        }
      }
    }

    const assignMatch = input.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    const exprToEval = assignMatch ? (assignMatch[2] as string) : input;
    const tokensRes = tokenise(exprToEval, smartIds ? { envNames: Object.keys(env) } : undefined);
    if (tokensRes.isOk()) {
      if (debug) {
        const tokenLine = `TOKENS: ${formatTokens(tokensRes.value as Token[])}`;
        const recent = DebugBus.getRecentLines?.(8) ?? [];
        const recentLine = recent.length ? ` | ${recent.join(" | ")}` : "";
        setHint(`${tokenLine}${recentLine}`);
      }
      const evalRes = evaluate(tokensRes.value as Token[], ans, new Decimal(0), angle, env);
      if (debug) {
        const recent = DebugBus.getRecentLines?.(8) ?? [];
        const recentLine = recent.length ? ` | ${recent.join(" | ")}` : "";
        setHint(`ANS: ${ans.toString()}${recentLine}`);
      }
      if (evalRes.isOk()) {
        const baseValue = evalRes.value;
        const chosen = chooseDisplayFor(tokensRes.value as Token[], baseValue, prefs);
        setResult(formatResult(chosen.display.toNumber()));
        setResultUnit(chosen.unit);
        if (!debug) setHint(null);
        return;
      } else if (debug) {
        const recent = DebugBus.getRecentLines?.(8) ?? [];
        const recentLine = recent.length ? ` | ${recent.join(" | ")}` : "";
        setHint(`EVAL_ERR: ${(evalRes as any).error}${recentLine}`);
      }
    } else if (debug) {
      // Tokeniser error: show caret at error index
      const err = tokensRes.error as any;
      if (err && err.idx !== undefined) {
        const idx = err.idx as number;
        const caret = `${exprToEval}\n${" ".repeat(Math.max(0, idx))}^`;
        const recent = DebugBus.getRecentLines?.(8) ?? [];
        const recentLine = recent.length ? ` | ${recent.join(" | ")}` : "";
        setHint(`LEX_ERR @ ${idx}${recentLine}\n${caret}`);
      }
    }
    if (!debug) {
      setResult("");
      setResultUnit(null);
      const functionHint = getFunctionHint(input);
      setHint(functionHint);
    }
  }, [input, env, prefs, debug, angle, ans]);

  // Called by UI when user types; resets navigation index
  const onInputChange = useMemo(() => {
    return (next: string) => {
      setInput(next);
      if (historyIndex !== -1) setHistoryIndex(-1);
    };
  }, [historyIndex]);

  // Navigate to previous history item (Up)
  const onHistoryPrev = useMemo(() => {
    return () => {
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      const item = history[nextIndex];
      if (item) setInput(item.expression);
    };
  }, [historyIndex, history]);

  // Navigate to next history item (Down); when past the end, clear input
  const onHistoryNext = useMemo(() => {
    return () => {
      if (history.length === 0) return;
      if (historyIndex === -1) {
        // Already at live input; keep as-is
        return;
      }
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(nextIndex);
        const item = history[nextIndex];
        if (item) setInput(item.expression);
      }
    };
  }, [historyIndex, history]);

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

      // Toggle debug
      const cmdDebug = trimmed.match(/^\s*\/debug\s+(on|off)\s*$/i);
      // Toggle Smart IDs
      const cmdSmartIds = trimmed.match(/^\s*\/smartids\s+(on|off)\s*$/i);
      if (cmdSmartIds) {
        const onoff = (cmdSmartIds[1] as string).toLowerCase();
        const next = onoff === "on";
        setSmartIds(next);
        const msg = next ? "Smart identifier splitting ON" : "Smart identifier splitting OFF";
        setHistory(prev => [...prev, { expression: `/smartids ${onoff}`, result: msg, unit: null }]);
        setResult(msg);
        setResultUnit(null);
        setHint(null);
        setInput("");
        setHistoryIndex(-1);
        return;
      }
      if (cmdDebug) {
        const onoff = (cmdDebug[1] as string).toLowerCase();
        setDebug(onoff === "on");
        DebugBus.setEnabled(onoff === "on");
        const msg = onoff === "on" ? "Debug enabled" : "Debug disabled";
        setHistory(prev => [...prev, { expression: `/debug ${onoff}`, result: msg, unit: null }]);
        setResult(msg);
        setResultUnit(null);
        setHint(null);
        setInput("");
        setHistoryIndex(-1);
        return;
      }

      // Toggle angle unit
      const cmdAngle = trimmed.match(/^\s*\/angle\s+(rad|deg)\s*$/i);
      if (cmdAngle) {
        const next = (cmdAngle[1] as string).toLowerCase() as "rad" | "deg";
        setAngle(next);
        const msg = `Angle set to ${next}`;
        setHistory(prev => [...prev, { expression: `/angle ${next}`, result: msg, unit: null }]);
        setResult(msg);
        setResultUnit(null);
        setHint(null);
        setInput("");
        setHistoryIndex(-1);
        return;
      }

      // Toggle SI base units display
      const cmdSi = trimmed.match(/^\s*\/si\s+(on|off)\s*$/i);
      if (cmdSi) {
        const onoff = (cmdSi[1] as string).toLowerCase();
        setPrefs(prev => ({
          ...prev,
          global: { ...(prev.global ?? { siBaseMode: "auto", showDerivedAnnotations: false }), siBaseMode: onoff === "on" ? "si" : "auto" },
        }));
        const msg = onoff === "on" ? "SI base units on" : "SI base units auto";
        setHistory(prev => [...prev, { expression: `/si ${onoff}`, result: msg, unit: null }]);
        setResult(msg);
        setResultUnit(null);
        setHint(null);
        setInput("");
        setHistoryIndex(-1);
        return;
      }

      // Apply unit preference: /unit <family> <unit|auto> and /unit global si|auto
      const cmdUnit = trimmed.match(/^\s*\/unit\s+(\w+)\s+(\w+)\s*$/i);
      if (cmdUnit) {
        const familyRaw = (cmdUnit[1] as string).toLowerCase();
        const value = (cmdUnit[2] as string).toLowerCase();
        if (familyRaw === "global") {
          if (value === "si" || value === "auto") {
            setPrefs(prev => ({
              ...prev,
              global: { ...(prev.global ?? { siBaseMode: "auto", showDerivedAnnotations: false }), siBaseMode: value as "si" | "auto" },
            }));
            const msg = value === "si" ? "global set to SI base units" : "global set to auto units";
            setHistory(prev => [...prev, { expression: `/unit global ${value}`, result: msg, unit: null }]);
            setResult(msg);
            setResultUnit(null);
            setHint(null);
            setInput("");
            setHistoryIndex(-1);
            return;
          }
          // derived annotations toggle
          if (value === "derived") {
            const onoff = input.trim().match(/^\s*\/unit\s+global\s+derived\s+(on|off)\s*$/i)?.[1]?.toLowerCase();
            if (onoff === "on" || onoff === "off") {
              setPrefs(prev => ({
                ...prev,
                global: { ...(prev.global ?? { siBaseMode: "auto", showDerivedAnnotations: false }), showDerivedAnnotations: onoff === "on" },
              }));
              const msg = `global derived annotations ${onoff}`;
              setHistory(prev => [...prev, { expression: `/unit global derived ${onoff}`, result: msg, unit: null }]);
              setResult(msg);
              setResultUnit(null);
              setHint(null);
              setInput("");
              setHistoryIndex(-1);
              return;
            }
          }
        }
        const family = familyRaw === "length" ? "length" : familyRaw === "time" ? "time" : familyRaw === "volume" ? "volume" : null;
        if (family) {
          if (value === "auto") {
            setPrefs(prev => ({ ...prev, [family]: { mode: "auto" } }));
          } else {
            setPrefs(prev => ({ ...prev, [family]: { mode: "fixed", unit: value } }));
          }
          const famLabel = family;
          const msg = value === "auto" ? `${famLabel} display set to auto` : `${famLabel} fixed to ${value}`;
          setHistory(prev => [...prev, { expression: `/unit ${family} ${value}`, result: msg, unit: null }]);
          setResult(msg);
          setResultUnit(null);
          setHint(null);
          setInput("");
          setHistoryIndex(-1);
          return;
        }
      }

      // Show unit options: /unit or /unit <family> or /unit global
      if (/^\s*\/unit\s*$/i.test(trimmed)) {
        const families = ["global", "time", "length", "volume"];
        const msg = `Families: ${families.join(", ")}. Usage: /unit <family> <unit|auto>. For global: /unit global si|auto`;
        setHistory(prev => [...prev, { expression: `/unit`, result: msg, unit: null }]);
        setResult(msg);
        setResultUnit(null);
        setHint(null);
        setInput("");
        setHistoryIndex(-1);
        return;
      }
      if (/^\s*\/unit\s+global\s*$/i.test(trimmed)) {
        const now = prefs.global?.siBaseMode ?? "auto";
        const msg = `global modes: si, auto (current: ${now}). Use: /unit global si|auto`;
        setHistory(prev => [...prev, { expression: `/unit global`, result: msg, unit: null }]);
        setResult(msg);
        setResultUnit(null);
        setHint(null);
        setInput("");
        setHistoryIndex(-1);
        return;
      }
      const cmdUnitFamOnly = trimmed.match(/^\s*\/unit\s+(\w+)\s*$/i);
      if (cmdUnitFamOnly) {
        const famUi = (cmdUnitFamOnly[1] as string).toLowerCase();
        const famKey = famUi === "length" ? "length_si" : famUi === "volume" ? "volume_si" : famUi === "time" ? "time" : null;
        if (famKey && (UNIT_FAMILIES as any)[famKey]) {
          const rep = (UNIT_FAMILIES as any)[famKey][0] as string;
          const repDef = (UNITS as any)[rep];
          if (repDef) {
            const all = Object.keys(UNITS).filter((k) => {
              const u = (UNITS as any)[k];
              return u && dimsEqual(u.dims, repDef.dims);
            }).sort();
            const msg = `${famUi} units: ${all.join(", ")}. Use: /unit ${famUi} <unit|auto>`;
            setHistory(prev => [...prev, { expression: `/unit ${famUi}`, result: msg, unit: null }]);
            setResult(msg);
            setResultUnit(null);
            setHint(null);
            setInput("");
            setHistoryIndex(-1);
            return;
          }
        }
      }

      // Function definition: f(x,y)=<expr>
      const funcDef = trimmed.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*=\s*(.+)$/);
      if (funcDef) {
        const name = funcDef[1] as string;
        const paramsRaw = funcDef[2] as string;
        const bodySrc = funcDef[3] as string;
        const params = paramsRaw.split(/\s*,\s*/).filter(Boolean);
        // Validate params
        if (!params.every(p => /^[A-Za-z_][A-Za-z0-9_]*$/.test(p))) {
          return; // ignore invalid definition silently
        }
        const bodyTokensRes = tokenise(bodySrc, smartIds ? { envNames: Object.keys(env) } : undefined);
        if (bodyTokensRes.isOk()) {
          setEnv(prev => ({ ...prev, [name]: { params, body: bodyTokensRes.value } }));
          const debugSuffix = debug ? ` [TOKENS ${formatTokens(bodyTokensRes.value as Token[])}]` : "";
          setHistory(prev => [...prev, { expression: `${name}(${params.join(",")}) = ${bodySrc}${debugSuffix}`, result: "", unit: null }]);
          setInput("");
          setHistoryIndex(-1);
          return;
        }
      }

      // Variable assignment: a = <expr>
      const assignMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const name = assignMatch[1] as string;
        const rhs = assignMatch[2] as string;
        const tokensRes = tokenise(rhs, smartIds ? { envNames: Object.keys(env) } : undefined);
        if (tokensRes.isOk()) {
          const evalRes = evaluate(tokensRes.value as Token[], ans, new Decimal(0), angle, env);
          if (evalRes.isOk()) {
            const value = evalRes.value;
            setEnv(prev => ({ ...prev, [name]: value }));
            const chosen = chooseDisplayFor(tokensRes.value as Token[], value, prefs);
            const formattedResult = formatResult(chosen.display.toNumber());
            const unitName = chosen.unit;
            const newHistoryItem: HistoryItem = { expression: `${name} = ${rhs}`, result: formattedResult, unit: unitName };
            setHistory(prev => [...prev, newHistoryItem]);
            // Update ans to last confirmed result (scalar decimal value)
            setAns(value.value);
          setInput("");
          setHistoryIndex(-1);
            return;
          }
        }
      }

      if (result) {
        let exprText = trimmed;
        if (debug) {
          const tokensRes = tokenise(trimmed, smartIds ? { envNames: Object.keys(env) } : undefined);
          if (tokensRes.isOk()) {
            exprText = `${trimmed} [TOKENS ${formatTokens(tokensRes.value as Token[])}]`;
          }
        }
        const newHistoryItem: HistoryItem = { expression: exprText, result: result, unit: resultUnit };
        setHistory(prev => [...prev, newHistoryItem]);
        // Evaluate to update ans register on confirmed entry
        const tokensRes = tokenise(trimmed, smartIds ? { envNames: Object.keys(env) } : undefined);
        if (tokensRes.isOk()) {
          const evalRes = evaluate(tokensRes.value as Token[], ans, new Decimal(0), angle, env);
          if (evalRes.isOk()) setAns(evalRes.value.value);
        }
        setInput("");
        setHistoryIndex(-1);
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
    onInputChange,
    onHistoryPrev,
    onHistoryNext,
  } as const;
}