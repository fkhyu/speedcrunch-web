// SyntaxHighlightedInput.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import Autocomplete from "./Autocomplete";
import {
  getAutocompleteMatches,
  AutocompleteItem,
} from "../utils/autocompleteData";

interface SyntaxHighlightedInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void; // Add onEnter callback
  disableAutocomplete?: boolean; // developer toggle
}

const SyntaxHighlightedInput: React.FC<SyntaxHighlightedInputProps> = ({
  value,
  onChange,
  onEnter,
  disableAutocomplete = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    AutocompleteItem[]
  >([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Function to highlight syntax
  const highlightSyntax = useCallback((text: string): string => {
    if (!text) return "";

    // Split text into tokens to avoid HTML conflicts

    // Define patterns for different syntax elements (order matters!)
    const patterns = [
      // Functions first (to avoid conflict with unit highlighting)
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
      // Numbers (including decimals, scientific notation, hex, binary)
      {
        regex: /\b(0x[0-9a-fA-F]+|0b[01]+|\d+\.?\d*([eE][+-]?\d+)?)\b/g,
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
  }, []);

  // Update highlight when value changes
  useEffect(() => {
    if (highlightRef.current) {
      const highlighted = highlightSyntax(value);
      highlightRef.current.innerHTML = highlighted;
    }
  }, [value, highlightSyntax]);

  // Sync scroll position
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Handle input changes
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart || 0;

    // Replace * with × and : with ÷
    newValue = newValue.replace(/\*/g, "×").replace(/:/g, "÷");

    // Replace "pi" with π symbol (but not when it's part of a longer word)
    newValue = newValue.replace(/\bpi\b/g, "π");

    onChange(newValue);
    setCursorPosition(newCursorPosition);

    // Update autocomplete suggestions
    const suggestions = disableAutocomplete
      ? []
      : getAutocompleteMatches(newValue, newCursorPosition);
    setAutocompleteSuggestions(suggestions);
    setShowAutocomplete(!disableAutocomplete && suggestions.length > 0);
    setSelectedSuggestionIndex(0);
  }; // Handle cursor position changes
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      const newCursorPosition = textareaRef.current.selectionStart || 0;
      setCursorPosition(newCursorPosition);

      // Update autocomplete when cursor moves
      const suggestions = disableAutocomplete
        ? []
        : getAutocompleteMatches(value, newCursorPosition);
      setAutocompleteSuggestions(suggestions);
      setShowAutocomplete(!disableAutocomplete && suggestions.length > 0);
      setSelectedSuggestionIndex(0);
    }
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = (item: AutocompleteItem) => {
    if (!textareaRef.current) return;

    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);
    const words = beforeCursor.split(/[^a-zA-Z]/);
    const currentWord = (words[words.length - 1] ?? "");

    // Replace the current word with the selected item
    const newBeforeCursor = beforeCursor.substring(
      0,
      beforeCursor.length - currentWord.length
    );
    let replacement = item.name;

    // Add parentheses for functions
    if (item.type === "function") {
      replacement += "(";
    }

    const newValue = newBeforeCursor + replacement + afterCursor;
    const newCursorPos = newBeforeCursor.length + replacement.length;

    onChange(newValue);
    setShowAutocomplete(false);

    // Set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Handle focus and blur
  const handleBlur = () => {
    // Don't hide autocomplete immediately to allow clicks
    setTimeout(() => {
      setShowAutocomplete(false);
    }, 150);
    // Do not auto-refocus so users can select/copy from history/output
  };

  // Handle key events for better UX
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle π symbol insertion with Alt+P (or Ctrl+P on Windows)
    if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
      e.preventDefault();
      insertTextAtCursor("π");
      return;
    }

    if (showAutocomplete && autocompleteSuggestions.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
          );
          break;
        case "Tab":
        case "Enter":
          if (e.key === "Enter") {
            e.preventDefault();
          }
          {
            const sel = autocompleteSuggestions[selectedSuggestionIndex];
            if (sel) handleAutocompleteSelect(sel);
          }
          break;
        case "Escape":
          setShowAutocomplete(false);
          break;
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Call the onEnter callback if provided
      if (onEnter && value.trim()) {
        onEnter();
      }
    }
  };

  // Helper function to insert text at cursor position
  const insertTextAtCursor = (text: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentValue = textareaRef.current.value;

    const newValue =
      currentValue.slice(0, start) + text + currentValue.slice(end);
    const newCursorPos = start + text.length;

    onChange(newValue);

    // Set cursor position after the inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Autocomplete dropdown */}
      <Autocomplete
        suggestions={autocompleteSuggestions}
        selectedIndex={selectedSuggestionIndex}
        onSelect={handleAutocompleteSelect}
        visible={showAutocomplete}
      />

      {/* Highlighted background layer */}
      <div
        ref={highlightRef}
        className="absolute inset-0 w-full h-full bg-[#26001A] font-mono text-md p-2 px-3 pointer-events-none overflow-hidden whitespace-pre-wrap word-break z-0 leading-relaxed"
        style={{
          wordBreak: "break-all",
          overflowWrap: "break-word",
        }}
      />

      {/* Transparent textarea overlay */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onSelect={handleSelectionChange}
        onBlur={handleBlur}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        className="relative w-full h-full bg-transparent font-mono text-md p-2 px-3 focus:outline-none resize-none z-10 leading-relaxed"
        style={{
          color: "transparent",
          caretColor: "white",
          wordBreak: "break-all",
          overflowWrap: "break-word",
        }}
        rows={1}
        autoFocus
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        // autoCapitalize="off"
      />
    </div>
  );
};

export default SyntaxHighlightedInput;