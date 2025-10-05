// SyntaxDemo.tsx - A demo component to show syntax highlighting examples
import React from "react";

const SyntaxDemo: React.FC = () => {
  const examples = [
    { text: "123 + 456", description: "Numbers (white) + Operator (yellow)" },
    {
      text: "sin(45) * cos(30)",
      description: "Functions (red) with operators",
    },
    { text: "log(100) + ln(e)", description: "Logarithmic functions" },
    { text: "5 meters + 3 kg", description: "Numbers + Units (green)" },
    { text: "sqrt(16) ^ 2", description: "Mixed: function, number, operator" },
    { text: "pi * radius^2", description: "Constants and variables" },
    { text: "(2 + 3) * velocity", description: "Parentheses and text" },
  ];

  const highlightSyntax = (text: string): string => {
    let highlightedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const patterns = [
      {
        regex:
          /\b(log|ln|sin|cos|tan|asin|acos|atan|sqrt|abs|exp|floor|ceil|round|min|max|pow|factorial|pi|e)\b/gi,
        className: "text-red-400",
      },
      {
        regex: /\b\d+\.?\d*([eE][+-]?\d+)?\b/g,
        className: "text-white",
      },
      {
        regex: /[+\-*/^%=()[\]{}]/g,
        className: "text-yellow-400",
      },
      {
        regex: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,
        className: "text-green-400",
      },
    ];

    patterns.forEach((pattern) => {
      highlightedText = highlightedText.replace(
        pattern.regex,
        (match) => `<span class="${pattern.className}">${match}</span>`
      );
    });

    return highlightedText;
  };

  return (
    <div className="p-6 bg-gray-900 text-white">
      <h2 className="text-xl font-bold mb-4">Syntax Highlighting Examples</h2>
      <div className="space-y-3">
        {examples.map((example, index) => (
          <div key={index} className="border border-gray-700 rounded p-3">
            <div
              className="font-mono text-lg bg-[#26001A] p-2 rounded mb-2"
              dangerouslySetInnerHTML={{
                __html: highlightSyntax(example.text),
              }}
            />
            <div className="text-sm text-gray-400">{example.description}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-sm">
        <h3 className="font-semibold mb-2">Color Legend:</h3>
        <ul className="space-y-1">
          <li>
            <span className="text-white">■</span> Numbers: White
          </li>
          <li>
            <span className="text-yellow-400">■</span> Operators (+, -, *, /, ^,
            etc.): Yellow
          </li>
          <li>
            <span className="text-red-400">■</span> Functions (sin, cos, log,
            etc.): Red
          </li>
          <li>
            <span className="text-green-400">■</span> Text/Units/Variables:
            Green
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SyntaxDemo;
