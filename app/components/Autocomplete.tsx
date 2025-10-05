// Autocomplete.tsx
import React from "react";
import { AutocompleteItem } from "../utils/autocompleteData";

interface AutocompleteProps {
  suggestions: AutocompleteItem[];
  selectedIndex: number;
  onSelect: (item: AutocompleteItem) => void;
  visible: boolean;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  visible,
}) => {
  if (!visible || suggestions.length === 0) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "function":
        return "text-red-400";
      case "constant":
        return "text-blue-400";
      case "unit":
        return "text-green-400";
      case "operator":
        return "text-yellow-400";
      default:
        return "text-white";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "function":
        return "ƒ";
      case "constant":
        return "π";
      case "unit":
        return "u";
      case "operator":
        return "±";
      default:
        return "?";
    }
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
      {suggestions.map((item, index) => (
        <div
          key={`${item.name}-${item.type}`}
          className={`p-3 cursor-pointer border-b border-gray-700 last:border-b-0 hover:bg-gray-800 ${
            index === selectedIndex ? "bg-gray-800" : ""
          }`}
          onClick={() => onSelect(item)}
        >
          <div className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${getTypeColor(
                item.type
              )} bg-gray-800`}
            >
              {getTypeIcon(item.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono font-semibold ${getTypeColor(
                    item.type
                  )}`}
                >
                  {item.name}
                </span>
                <span className="text-xs text-gray-500 uppercase">
                  {item.type}
                </span>
              </div>
              <div className="text-sm text-gray-400 truncate">
                {item.description}
              </div>
              {item.example && (
                <div className="text-xs text-gray-500 font-mono mt-1">
                  Example: {item.example}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <div className="p-2 text-xs text-gray-500 bg-gray-800 rounded-b-lg">
        Press Tab or Enter to select, Esc to close
      </div>
    </div>
  );
};

export default Autocomplete;
