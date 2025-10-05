// History.tsx
import React from "react";
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
  return (
    <div className="w-full mt-4 text-sm text-gray-300 bg-[#300A24] h-screen overflow-y-auto px-4">
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
