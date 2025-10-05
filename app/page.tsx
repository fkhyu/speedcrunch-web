"use client";

import Display from "./components/Display";
import History from "./components/History";
import SyntaxHighlightedInput from "./components/SyntaxHighlightedInput";
import { useCalculator } from "./hooks/useCalculator";

export default function Home() {
  const { input, setInput, result, resultUnit, hint, history, handleEnter } = useCalculator();

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