// History.tsx
import React, { useEffect, useRef } from "react";
import { highlightSyntax } from "../utils/syntaxHighlighter";

interface HistoryItem {
  expression: string;
  result: string;
  unit?: string | null;
}

interface HistoryProps {
  items: HistoryItem[];
}

const History: React.FC<HistoryProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [items.length]);

  return (
    <div ref={containerRef} className="w-full mt-4 text-sm text-gray-300 bg-[#300A24] h-screen overflow-y-auto px-4 select-text">
      {items.map((item, index) => (
        <div key={index} className="mb-4">
          <div
            className="font-mono"
            dangerouslySetInnerHTML={{
              __html: highlightSyntax(item.expression),
            }}
          />
          <div className="text-cyan-500">
            = <span className="font-mono">{item.result}</span>
            {item.unit && <span className="font-mono ml-1">{item.unit}</span>}
          </div>
          {index < items.length - 1 && <div className="h-4" />}
        </div>
      ))}
    </div>
  );
};

export default History;