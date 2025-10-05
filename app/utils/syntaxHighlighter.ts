// syntaxHighlighter.ts

export const highlightSyntax = (text: string): string => {
  if (!text) return "";

  // Define patterns for different syntax elements
  const patterns = [
    {
      regex:
        /\b(log|lg|ln|sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|sqrt|cbrt|abs|exp|exp2|exp10|floor|ceil|round|trunc|min|max|pow|factorial|gamma|lgamma|deg|rad)\b/gi,
      type: "function",
    },
    // Constants (pi, e, and π symbol)
    {
      regex: /\b(pi|e)\b|π/gi,
      type: "constant",
    },
    // Numbers (including decimals with dots or commas, scientific notation, hex, binary)
    {
      regex: /\b(0x[0-9a-fA-F]+|0b[01]+|\d+[.,]?\d*([eE][+-]?\d+)?)\b/g,
      type: "number",
    },
    // Operators and symbols
    {
      regex: /[+\-×÷\/\*:^%=()[\]{}!<>≤≥≠≈∞;]/g,
      type: "operator",
    },
    // Units and remaining text (letters that aren't functions or constants)
    {
      regex: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,
      type: "text",
    },
  ];

  // Create a master regex that captures all patterns
  const allMatches: Array<{
    match: string;
    type: string;
    index: number;
    end: number;
  }> = [];

  patterns.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        match: match[0],
        type: pattern.type,
        index: match.index,
        end: match.index + match[0].length,
      });
    }
  });

  // Sort matches by index, then by priority (functions first)
  allMatches.sort((a, b) => {
    if (a.index !== b.index) {
      return a.index - b.index;
    }
    // If same position, prioritize: functions, constants, numbers, operators, then text
    const priority = {
      function: 0,
      constant: 1,
      number: 2,
      operator: 3,
      text: 4,
    };
    return (
      priority[a.type as keyof typeof priority] -
      priority[b.type as keyof typeof priority]
    );
  });

  // Remove overlapping matches (keep higher priority ones)
  const filteredMatches: Array<{
    match: string;
    type: string;
    index: number;
    end: number;
  }> = [];
  allMatches.forEach((match) => {
    const isOverlapping = filteredMatches.some(
      (existing) =>
        (match.index >= existing.index && match.index < existing.end) ||
        (match.end > existing.index && match.end <= existing.end) ||
        (match.index <= existing.index && match.end >= existing.end)
    );
    if (!isOverlapping) {
      filteredMatches.push(match);
    }
  });

  // Build highlighted text
  let result = "";
  let lastIndex = 0;

  filteredMatches.forEach(({ match, type, index }) => {
    // Add any text before this match
    if (index > lastIndex) {
      const beforeText = text.slice(lastIndex, index);
      result += beforeText.replace(/[<>&"']/g, (char) => {
        switch (char) {
          case "<":
            return "&lt;";
          case ">":
            return "&gt;";
          case "&":
            return "&amp;";
          case '"':
            return "&quot;";
          case "'":
            return "&#39;";
          default:
            return char;
        }
      });
    }

    // Add the highlighted match
    const className = {
      function: "text-red-400",
      constant: "text-blue-400",
      number: "text-white",
      operator: "text-yellow-400",
      text: "text-green-400",
    }[type];

    const escapedMatch = match.replace(/[<>&"']/g, (char) => {
      switch (char) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return char;
      }
    });

    result += `<span class="${className}">${escapedMatch}</span>`;
    lastIndex = index + match.length;
  });

  // Add any remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    result += remainingText.replace(/[<>&"']/g, (char) => {
      switch (char) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return char;
      }
    });
  }

  return result;
};
