"use client";

import Display from "./components/Display";
import History from "./components/History";
import SyntaxHighlightedInput from "./components/SyntaxHighlightedInput";
import { useState, useEffect } from "react";
import { MathEvaluator } from "./utils/mathEvaluator";
import { getFunctionHint } from "./utils/autocompleteData";

interface HistoryItem {
  expression: string;
  result: string;
  unit?: string | null;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string>("");
  const [resultUnit, setResultUnit] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Calculate result and check for hints whenever input changes
  useEffect(() => {
    if (input.trim()) {
      const evaluation = MathEvaluator.evaluate(input);
      if (evaluation.result !== null) {
        // Format the result nicely
        const formattedResult = formatResult(evaluation.result);
        setResult(formattedResult);
        setResultUnit(evaluation.unit || null);
        setHint(null); // Clear hint when we have a result
      } else {
        setResult("");
        setResultUnit(null);
        // Check for function hints
        const functionHint = getFunctionHint(input);
        setHint(functionHint);
      }
    } else {
      setResult("");
      setResultUnit(null);
      setHint(null);
    }
  }, [input]);

  // Format the result for display
  const formatResult = (num: number): string => {
    // Handle very large or very small numbers
    if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(6);
    }

    // Handle integers
    if (Number.isInteger(num)) {
      return num.toString();
    }

    // Handle decimals - limit to reasonable precision
    const rounded = Math.round(num * 1e10) / 1e10;
    return rounded.toString();
  };

  const handleButton = (value: string) => {
    // Update input or evaluate calculation
  };

  const handleEnter = () => {
    if (input.trim() && result) {
      // Add the current expression and result to history
      const newHistoryItem: HistoryItem = {
        expression: input.trim(),
        result: result,
        unit: resultUnit,
      };

      setHistory((prev) => [...prev, newHistoryItem]);
      setInput(""); // Clear the input after adding to history
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#300A24] max-h-screen text-white">
      <History items={history} />

      <div className="absolute z-10 bottom-0 w-full">
        {(result || hint) && (
          <Display value={result} hint={hint} unit={resultUnit} />
        )}
        <SyntaxHighlightedInput
          value={input}
          onChange={setInput}
          onEnter={handleEnter}
        />
      </div>
    </div>
  );
}
