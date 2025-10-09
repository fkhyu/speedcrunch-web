import React from 'react';
import Display from './components/Display';
import History from './components/History';
import SyntaxHighlightedInput from './components/SyntaxHighlightedInput';
import ErrorBoundary from './components/ErrorBoundary';
import { useCalculator } from './hooks/useCalculator';

function App() {
  const { input, result, resultUnit, hint, history, handleEnter, onInputChange, onHistoryPrev, onHistoryNext } = useCalculator();

  return (
    <ErrorBoundary>
      <div className="flex flex-col items-center min-h-screen bg-[#300A24] max-h-screen text-white">
        <History items={history} />

        <div className="relative z-10 w-full">
          {(result || hint) && (
            <div className="absolute left-0 flex justify-start w-full bottom-full mb-2">
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
    </ErrorBoundary>
  );
}

export default App;
