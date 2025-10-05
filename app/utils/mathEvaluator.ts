// mathEvaluator.ts

export interface MathEvaluatorResult {
  result: number | null;
  error: string | null;
  unit?: string | null;
  expression?: string | null;
}

export class MathEvaluator {
  // Define prefixes as multipliers
  private static readonly METRIC_PREFIXES: { [key: string]: number } = {
    kilo: 1000,
    mega: 1000000,
    giga: 1000000000,
    tera: 1000000000000,
    milli: 0.001,
    micro: 0.000001,
    nano: 0.000000001,
    centi: 0.01,
  };

  // Commonly used prefix+unit combinations
  private static readonly STANDARD_COMBINATIONS: Set<string> = new Set([
    // Mass
    "kilogram",
    "kilo gram",
    "milligram",
    "milli gram",
    // Length
    "kilometer",
    "kilo meter",
    "centimeter",
    "centi meter",
    "millimeter",
    "milli meter",
    "micrometer",
    "micro meter",
    "nanometer",
    "nano meter",
    // Data
    "kilobyte",
    "kilo byte",
    "megabyte",
    "mega byte",
    "gigabyte",
    "giga byte",
    "terabyte",
    "tera byte",
    // Frequency
    "kilohertz",
    "kilo hertz",
    "megahertz",
    "mega hertz",
    "gigahertz",
    "giga hertz",
    // Power
    "kilowatt",
    "kilo watt",
    // Energy
    "kilocalorie",
    "kilo calorie",
    // Time
    "millisecond",
    "milli second",
    "microsecond",
    "micro second",
  ]);

  // Define unit categories for proper tracking
  private static readonly UNIT_CATEGORIES: { [key: string]: string } = {
    // Length
    meter: "length",
    foot: "length",
    inch: "length",
    yard: "length",
    mile: "length",
    nautical_mile: "length",
    fathom: "length",
    lightyear: "length",
    lightminute: "length",
    lightsecond: "length",
    parsec: "length",
    astronomical_unit: "length",

    // Mass
    kg: "mass",
    gram: "mass",
    tonne: "mass",
    pound: "mass",
    ounce: "mass",
    stone: "mass",
    ton: "mass",

    // Time
    second: "time",
    minute: "time",
    hour: "time",
    day: "time",
    week: "time",
    month: "time",
    year: "time",
    decade: "time",
    century: "time",

    // Volume
    liter: "volume",
    milliliter: "volume",
    cubic_meter: "volume",
    gallon: "volume",
    quart: "volume",
    pint: "volume",
    cup: "volume",
    fluid_ounce: "volume",
    tablespoon: "volume",
    teaspoon: "volume",

    // Area
    square_meter: "area",
    square_foot: "area",
    acre: "area",
    hectare: "area",

    // Temperature
    celsius: "temperature",
    fahrenheit: "temperature",
    kelvin: "temperature",

    // Energy
    joule: "energy",
    calorie: "energy",
    kilocalorie: "energy",
    watt: "power",
    kilowatt: "power",
    horsepower: "power",

    // Pressure
    pascal: "pressure",
    atmosphere: "pressure",
    psi: "pressure",
    torr: "pressure",

    // Speed
    mph: "speed",
    kph: "speed",
    knot: "speed",
    mach: "speed",

    // Frequency
    hertz: "frequency",
    kilohertz: "frequency",
    megahertz: "frequency",
    gigahertz: "frequency",

    // Data
    byte: "data",
    kilobyte: "data",
    megabyte: "data",
    gigabyte: "data",
    terabyte: "data",
    petabyte: "data",

    // Currency
    dollar: "currency",
    euro: "currency",
    pounds_sterling: "currency",
    yen: "currency",

    // Fun
    banana: "length",
    football_field: "length",
    library_of_congress: "data",
    olympic_pool: "volume",
  };
  // Define unit conversion factors
  private static readonly UNIT_VALUES: { [key: string]: number } = {
    // Length (meters as base)
    meter: 1,
    foot: 0.3048,
    inch: 0.0254,
    yard: 0.9144,
    mile: 1609.34,
    nautical_mile: 1852,
    fathom: 1.8288,
    lightyear: 9.461e15,
    lightminute: 1.799e10,
    lightsecond: 299792458,
    parsec: 3.086e16,
    astronomical_unit: 1.496e11,

    // Mass (grams as base)
    gram: 1,
    kg: 1000, // kilograms = 1000 grams
    tonne: 1000000,
    pound: 453.592,
    ounce: 28.3495,
    stone: 6350.29,
    ton: 907185,

    // Time (seconds as base)
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400,
    week: 604800,
    month: 2629746, // average month
    year: 31556952, // average year
    decade: 315569520,
    century: 3155695200,

    // For display purposes, we'll treat these as 1 for now
    // In a real application, you'd want proper unit tracking
    // Volume, area, temperature, etc. units
    liter: 1,
    milliliter: 1,
    cubic_meter: 1,
    gallon: 1,
    quart: 1,
    pint: 1,
    cup: 1,
    fluid_ounce: 1,
    tablespoon: 1,
    teaspoon: 1,
    square_meter: 1,
    square_foot: 1,
    acre: 1,
    hectare: 1,
    celsius: 1,
    fahrenheit: 1,
    kelvin: 1,
    joule: 1,
    calorie: 1,
    kilocalorie: 1,
    watt: 1,
    kilowatt: 1,
    horsepower: 1,
    pascal: 1,
    atmosphere: 1,
    psi: 1,
    torr: 1,
    mph: 1,
    kph: 1,
    knot: 1,
    mach: 1,
    hertz: 1,
    kilohertz: 1,
    megahertz: 1,
    gigahertz: 1,
    byte: 1,
    kilobyte: 1,
    megabyte: 1,
    gigabyte: 1,
    terabyte: 1,
    petabyte: 1,
    dollar: 1,
    euro: 1,
    pounds_sterling: 1,
    yen: 1,
    banana: 1,
    football_field: 1,
    library_of_congress: 1,
    olympic_pool: 1,
  };
  private static readonly MATH_FUNCTIONS = {
    // Trigonometric functions
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    asinh: Math.asinh,
    acosh: Math.acosh,
    atanh: Math.atanh,

    // Logarithmic functions
    lg: Math.log10, // log base 10
    ln: Math.log, // natural log

    // Power and root functions
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    pow: Math.pow,
    exp: Math.exp,
    exp2: (x: number) => Math.pow(2, x),
    exp10: (x: number) => Math.pow(10, x),

    // Rounding functions
    abs: Math.abs,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    trunc: Math.trunc,

    // Other functions
    min: Math.min,
    max: Math.max,
    factorial: (n: number) => {
      if (n < 0) return NaN;
      if (n === 0 || n === 1) return 1;
      let result = 1;
      for (let i = 2; i <= n; i++) {
        result *= i;
      }
      return result;
    },

    // Angle conversion
    deg: (x: number) => x * (Math.PI / 180),
    rad: (x: number) => x * (180 / Math.PI),

    // Constants
    pi: Math.PI,
    e: Math.E,
  };

  public static evaluate(expression: string): MathEvaluatorResult {
    try {
      if (!expression.trim()) {
        return { result: null, error: null };
      }

      // Convert decimal commas to dots (12,05 → 12.05)
      // Only replace commas that are between digits
      let processedExpression = expression.replace(/(\d),(\d)/g, "$1.$2");

      // Extract units from the original expression before processing
      const detectedUnits = this.extractUnits(processedExpression);

      // Replace mathematical symbols with JavaScript operators
      processedExpression = processedExpression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/\^/g, "**")
        .trim();

      // Handle implicit multiplication with constants and units
      // Examples: 2π → 2*π, 12kg → 12*kg, 5sin → 5*sin
      processedExpression =
        this.handleImplicitMultiplication(processedExpression);

      // Replace mathematical constants (after implicit multiplication)
      processedExpression = processedExpression
        .replace(/π/g, Math.PI.toString())
        .replace(/\bpi\b/gi, Math.PI.toString())
        .replace(/\be\b/gi, Math.E.toString());

      // Debug logging for π expressions
      if (
        expression.includes("π") ||
        expression.includes("log") ||
        expression.includes("sin")
      ) {
        console.log(
          "Processing expression:",
          expression,
          "→",
          processedExpression
        );
      }

      // Replace mathematical functions first (before handling log specially)
      Object.entries(this.MATH_FUNCTIONS).forEach(([name, func]) => {
        if (typeof func === "number") return; // Skip constants

        const regex = new RegExp(`\\b${name}\\s*\\(`, "gi");
        processedExpression = processedExpression.replace(
          regex,
          `Math.${name}(`
        );
      });

      // Handle log(base;num) syntax - convert to Math.log(num) / Math.log(base)
      processedExpression = processedExpression.replace(
        /\blog\s*\(\s*([^;]+)\s*;\s*([^)]+)\s*\)/gi,
        (match, base, num) => {
          return `(MATHLOG_PLACEHOLDER(${num}) / MATHLOG_PLACEHOLDER(${base}))`;
        }
      );

      // Handle regular log(num) as log base 10 - use split/join to avoid regex issues
      const parts = processedExpression.split("Math.log");
      processedExpression = parts[0];
      for (let i = 1; i < parts.length; i++) {
        processedExpression += "Math.log" + parts[i];
      }

      // Now replace remaining log( with Math.log10(
      processedExpression = processedExpression.replace(
        /\blog\s*\(/gi,
        "Math.log10("
      );

      // Replace the placeholders back to Math.log
      processedExpression = processedExpression.replace(
        /MATHLOG_PLACEHOLDER/g,
        "Math.log"
      );

      // Handle metric prefixes and units
      let firstUnitOfType: string | null = null;
      let firstUnitDisplay: string | null = null;
      let firstUnitValue: number | null = null;
      const unitsFound: Array<{
        unit: string;
        prefix: string | null;
        totalValue: number;
        display: string;
      }> = [];

      // Find all prefix + unit combinations first
      Object.entries(this.METRIC_PREFIXES).forEach(([prefix, prefixValue]) => {
        Object.entries(this.UNIT_VALUES).forEach(([unit, unitValue]) => {
          // Handle combined form (e.g., "kilograms")
          const combinedRegex = new RegExp(`\\b${prefix}${unit}\\b`, "gi");
          const combinedMatches = processedExpression.match(combinedRegex);
          if (combinedMatches) {
            const totalValue = prefixValue * unitValue;
            const combinedForm = `${prefix}${unit}`;
            const isStandard = this.STANDARD_COMBINATIONS.has(combinedForm);

            unitsFound.push({
              unit,
              prefix,
              totalValue,
              display: isStandard ? combinedForm : unit, // Use base unit for non-standard combinations
            });
          }

          // Handle separated form (e.g., "kilo grams")
          const separatedRegex = new RegExp(`\\b${prefix}\\s+${unit}\\b`, "gi");
          const separatedMatches = processedExpression.match(separatedRegex);
          if (separatedMatches) {
            const totalValue = prefixValue * unitValue;
            const separatedForm = `${prefix} ${unit}`;
            const isStandard = this.STANDARD_COMBINATIONS.has(separatedForm);

            unitsFound.push({
              unit,
              prefix,
              totalValue,
              display: isStandard ? separatedForm : unit, // Use base unit for non-standard combinations
            });
          }
        });
      });

      // Find standalone units (without prefixes)
      Object.entries(this.UNIT_VALUES).forEach(([unit, value]) => {
        const regex = new RegExp(`\\b${unit}\\b`, "gi");
        const matches = processedExpression.match(regex);
        if (matches) {
          unitsFound.push({
            unit,
            prefix: null,
            totalValue: value,
            display: unit,
          });
        }
      });

      // Set the first unit as the reference for display and conversion
      let needsResultConversion = false;
      let conversionFactor = 1;

      if (unitsFound.length > 0) {
        const firstUnit = unitsFound[0];
        firstUnitOfType = firstUnit.unit;

        // Check if the first unit is non-standard and needs conversion
        const isFirstUnitStandard = firstUnit.prefix
          ? this.STANDARD_COMBINATIONS.has(
              `${firstUnit.prefix}${firstUnit.unit}`
            ) ||
            this.STANDARD_COMBINATIONS.has(
              `${firstUnit.prefix} ${firstUnit.unit}`
            )
          : true;

        if (!isFirstUnitStandard && firstUnit.prefix) {
          // Non-standard unit - we'll convert the result
          needsResultConversion = true;
          conversionFactor = this.METRIC_PREFIXES[firstUnit.prefix];
          firstUnitDisplay = firstUnit.unit; // Display as base unit
        } else {
          firstUnitDisplay = firstUnit.display; // Keep original format
        }

        firstUnitValue = firstUnit.totalValue;

        // Replace all units with their values converted to the first unit's scale
        unitsFound.forEach(({ unit, prefix, totalValue, display }) => {
          if (
            this.UNIT_CATEGORIES[unit] ===
            this.UNIT_CATEGORIES[firstUnitOfType!]
          ) {
            // Same unit type - convert to first unit's scale
            const conversionFactor = totalValue / firstUnitValue!;

            if (prefix) {
              // Replace prefix + unit combinations
              const combinedRegex = new RegExp(`\\b${prefix}${unit}\\b`, "gi");
              const separatedRegex = new RegExp(
                `\\b${prefix}\\s+${unit}\\b`,
                "gi"
              );
              processedExpression = processedExpression
                .replace(combinedRegex, conversionFactor.toString())
                .replace(separatedRegex, conversionFactor.toString());
            } else {
              // Replace standalone unit
              const regex = new RegExp(`\\b${unit}\\b`, "gi");
              processedExpression = processedExpression.replace(
                regex,
                conversionFactor.toString()
              );
            }
          } else {
            // Different unit type - just replace with 1
            if (prefix) {
              const combinedRegex = new RegExp(`\\b${prefix}${unit}\\b`, "gi");
              const separatedRegex = new RegExp(
                `\\b${prefix}\\s+${unit}\\b`,
                "gi"
              );
              processedExpression = processedExpression
                .replace(combinedRegex, "1")
                .replace(separatedRegex, "1");
            } else {
              const regex = new RegExp(`\\b${unit}\\b`, "gi");
              processedExpression = processedExpression.replace(regex, "1");
            }
          }
        });
      }

      // Handle special functions that need custom implementation
      processedExpression = processedExpression
        .replace(/Math\.factorial\(/g, "this.factorial(")
        .replace(/Math\.lg\(/g, "Math.log10(")
        .replace(/Math\.exp2\(/g, "this.exp2(")
        .replace(/Math\.exp10\(/g, "this.exp10(")
        .replace(/Math\.deg\(/g, "this.deg(")
        .replace(/Math\.rad\(/g, "this.rad(")
        .replace(/Math\.pi\b/g, `${Math.PI}`)
        .replace(/Math\.ln\(/g, "Math.log(");

      // Validate the expression (basic security check)
      if (!this.isValidExpression(processedExpression)) {
        console.log("Expression failed validation:", processedExpression);
        return { result: null, error: "Invalid expression" };
      }

      // Create a safe evaluation context
      const safeEval = new Function(
        "Math",
        `
        const factorial = (n) => {
          if (n < 0) return NaN;
          if (n === 0 || n === 1) return 1;
          let result = 1;
          for (let i = 2; i <= n; i++) {
            result *= i;
          }
          return result;
        };
        
        const exp2 = (x) => Math.pow(2, x);
        const exp10 = (x) => Math.pow(10, x);
        const deg = (x) => x * (Math.PI / 180);
        const rad = (x) => x * (180 / Math.PI);
        
        return ${processedExpression};
      `
      );

      const result = safeEval(Math);

      let finalResult = result;

      // Convert result if we used a non-standard unit
      if (needsResultConversion) {
        finalResult = result * conversionFactor;
      }

      if (typeof finalResult !== "number" || !isFinite(finalResult)) {
        console.log("Result validation failed:", finalResult);
        return { result: null, error: "Invalid result" };
      }

      // Use the display form of the first unit (including prefix if applicable)
      const displayUnit =
        firstUnitDisplay ||
        (detectedUnits.length > 0 ? detectedUnits[0] : null);

      return {
        result: finalResult,
        error: null,
        unit: displayUnit,
        expression: processedExpression,
      };
    } catch (error) {
      console.log("Evaluation error:", error);
      return { result: null, error: "Calculation error" };
    }
  }

  private static extractUnits(expression: string): string[] {
    const units: string[] = [];
    const unitNames = Object.keys(this.UNIT_CATEGORIES);

    // Find all units in the expression
    unitNames.forEach((unit) => {
      const regex = new RegExp(`\\b${unit}\\b`, "gi");
      if (regex.test(expression)) {
        units.push(unit);
      }
    });

    return units;
  }

  private static handleImplicitMultiplication(expression: string): string {
    // Handle implicit multiplication cases sucg as:
    // 2π → 2*π, 2pi → 2*pi, 12kg → 12*kg, 5sin → 5*sin, etc.

    let result = expression;

    // Pattern for number followed by letters or special symbols
    // This handles: 2π, 2pi, 12kg, 5sin, etc.
    // But NOT log( or sin(
    result = result.replace(/(\d+)\s*([a-zA-Zπ](?![a-zA-Z]*\s*\())/g, "$1*$2");

    // Pattern for closing parenthesis followed by letters or opening parenthesis
    // This handles: (2+3)π, sin(x)cos(y), etc.
    result = result.replace(/(\))\s*([a-zA-Zπ(])/g, "$1*$2");

    // Pattern for constants/variables followed by opening parenthesis
    // This handles: π(2+3), e(x+1), etc.
    // BUT exclude function names like sin, cos, log, etc.
    const functionNames =
      /\b(sin|cos|tan|asin|acos|atan|log|ln|lg|sqrt|abs|floor|ceil|round|exp|exp2|exp10|factorial|deg|rad)\s*\(/gi;

    const functionPlaceholders: string[] = [];
    result = result.replace(functionNames, (match) => {
      const placeholder = `__FUNC_${functionPlaceholders.length}__`;
      functionPlaceholders.push(match);
      return placeholder;
    });

    result = result.replace(/([a-zA-Zπ])\s*(\()/g, "$1*$2");

    functionPlaceholders.forEach((func, index) => {
      result = result.replace(`__FUNC_${index}__`, func);
    });

    return result;
  }

  private static isValidExpression(expression: string): boolean {
    // Basic security checks
    const allowedPattern =
      /^[0-9+\-*/.()[\]\s,<>=!&|^%\w\u03C0\u221E\u2248\u2260\u2264\u2265\u00D7\u00F7;]*$/;

    // Check for dangerous patterns
    const dangerousPatterns = [
      /\bwhile\b/i,
      /\bfor\b/i,
      /\bif\b/i,
      /\beval\b/i,
      /\bfunction\b/i,
      /\breturn\b/i,
      /\bvar\b/i,
      /\blet\b/i,
      /\bconst\b/i,
      /\bclass\b/i,
      /\bnew\b/i,
      /\bthis\b/i,
      /\bwindow\b/i,
      /\bdocument\b/i,
      /\balert\b/i,
      /\bconsole\b/i,
      /\bprocess\b/i,
      /\brequire\b/i,
      /\bimport\b/i,
      /\bexport\b/i,
    ];

    return (
      allowedPattern.test(expression) &&
      !dangerousPatterns.some((pattern) => pattern.test(expression))
    );
  }
}
