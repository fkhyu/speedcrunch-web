"use client";

import Display from "./components/Display";
import History from "./components/History";
import SyntaxHighlightedInput from "./components/SyntaxHighlightedInput";
import { useCalculator } from "./hooks/useCalculator";

export default function Home() {
  const { input, result, resultUnit, hint, history, handleEnter, onInputChange, onHistoryPrev, onHistoryNext } = useCalculator();

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#300A24] max-h-screen text-white">
      <History items={history} />

      <div className="relative z-10 w-full">
        {(result || hint) && (
          <div className="absolute left-0 flex justify-start w-full pointer-events-none -top-12">
            <Display value={result} hint={hint} unit={resultUnit} />
          </div>
        )}

        <div className="w-full">
          <SyntaxHighlightedInput
            value={input}
            onChange={onInputChange}
            onEnter={handleEnter}
            onHistoryPrev={onHistoryPrev}
            onHistoryNext={onHistoryNext}
          />
        </div>
      </div>
    </div>
  );
}