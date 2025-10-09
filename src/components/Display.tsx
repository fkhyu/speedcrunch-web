// Display.tsx
import React from "react";

interface DisplayProps {
  value: string;
  hint?: string | null;
  unit?: string | null;
  error?: string | null;
}

const Display: React.FC<DisplayProps> = ({ value, hint, unit, error }) => {
  return (
    <div className="w-max bg-[#fffcfe] text-black text-md px-3 p-1 rounded-md ml-2 mb-2">
      {hint ? (
        <>
          <span className="text-blue-600 font-semibold">Hint: </span>
          <span className="font-mono">{hint}</span>
        </>
      ) : error ? (
        <>
          <span className="text-red-600 font-semibold">Error: </span>
          <span className="font-mono">{error}</span>
        </>
      ) : (
        <>
          Current result:{" "}
          <span className="font-bold font-mono">{value || "0"}</span>
          {unit && (
            <span className="text-green-600 font-mono ml-1">{unit}</span>
          )}
        </>
      )}
    </div>
  );
};

export default Display;