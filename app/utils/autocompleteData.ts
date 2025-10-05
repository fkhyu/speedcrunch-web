// autocompleteData.ts
export interface AutocompleteItem {
  name: string;
  type: "function" | "constant" | "unit" | "operator";
  description: string;
  example?: string;
  hint?: string;
}

export const AUTOCOMPLETE_DATA: AutocompleteItem[] = [
  // Trigonometric functions
  {
    name: "sin",
    type: "function",
    description: "Sine function",
    example: "sin(45)",
    hint: "sin(angle_in_radians)",
  },
  {
    name: "cos",
    type: "function",
    description: "Cosine function",
    example: "cos(45)",
    hint: "cos(angle_in_radians)",
  },
  {
    name: "tan",
    type: "function",
    description: "Tangent function",
    example: "tan(45)",
    hint: "tan(angle_in_radians)",
  },
  {
    name: "asin",
    type: "function",
    description: "Arcsine function",
    example: "asin(0.5)",
    hint: "asin(value)",
  },
  {
    name: "acos",
    type: "function",
    description: "Arccosine function",
    example: "acos(0.5)",
    hint: "acos(value)",
  },
  {
    name: "atan",
    type: "function",
    description: "Arctangent function",
    example: "atan(1)",
    hint: "atan(value)",
  },
  {
    name: "atan2",
    type: "function",
    description: "Two-argument arctangent",
    example: "atan2(y, x)",
    hint: "atan2(y, x)",
  },

  // Hyperbolic functions
  {
    name: "sinh",
    type: "function",
    description: "Hyperbolic sine",
    example: "sinh(1)",
    hint: "sinh(value)",
  },
  {
    name: "cosh",
    type: "function",
    description: "Hyperbolic cosine",
    example: "cosh(1)",
    hint: "cosh(value)",
  },
  {
    name: "tanh",
    type: "function",
    description: "Hyperbolic tangent",
    example: "tanh(1)",
    hint: "tanh(value)",
  },
  {
    name: "asinh",
    type: "function",
    description: "Inverse hyperbolic sine",
    example: "asinh(1)",
    hint: "asinh(value)",
  },
  {
    name: "acosh",
    type: "function",
    description: "Inverse hyperbolic cosine",
    example: "acosh(2)",
    hint: "acosh(value)",
  },
  {
    name: "atanh",
    type: "function",
    description: "Inverse hyperbolic tangent",
    example: "atanh(0.5)",
    hint: "atanh(value)",
  },

  // Logarithmic functions
  {
    name: "log",
    type: "function",
    description: "Logarithm (base 10 or custom)",
    example: "log(100) or log(2;8)",
    hint: "log(value) or log(base;value)",
  },
  {
    name: "lg",
    type: "function",
    description: "Logarithm base 10",
    example: "lg(100)",
    hint: "lg(value)",
  },
  {
    name: "ln",
    type: "function",
    description: "Natural logarithm",
    example: "ln(e)",
    hint: "ln(value)",
  },

  // Power and root functions
  {
    name: "sqrt",
    type: "function",
    description: "Square root",
    example: "sqrt(16)",
    hint: "sqrt(value)",
  },
  {
    name: "cbrt",
    type: "function",
    description: "Cube root",
    example: "cbrt(27)",
    hint: "cbrt(value)",
  },
  {
    name: "pow",
    type: "function",
    description: "Power function",
    example: "pow(2, 3)",
    hint: "pow(base, exponent)",
  },
  {
    name: "exp",
    type: "function",
    description: "Exponential function (e^x)",
    example: "exp(1)",
    hint: "exp(value)",
  },
  {
    name: "exp2",
    type: "function",
    description: "Base-2 exponential (2^x)",
    example: "exp2(3)",
    hint: "exp2(value)",
  },
  {
    name: "exp10",
    type: "function",
    description: "Base-10 exponential (10^x)",
    example: "exp10(2)",
    hint: "exp10(value)",
  },

  // Rounding functions
  {
    name: "abs",
    type: "function",
    description: "Absolute value",
    example: "abs(-5)",
    hint: "abs(value)",
  },
  {
    name: "floor",
    type: "function",
    description: "Round down to nearest integer",
    example: "floor(3.7)",
    hint: "floor(value)",
  },
  {
    name: "ceil",
    type: "function",
    description: "Round up to nearest integer",
    example: "ceil(3.2)",
    hint: "ceil(value)",
  },
  {
    name: "round",
    type: "function",
    description: "Round to nearest integer",
    example: "round(3.5)",
    hint: "round(value)",
  },
  {
    name: "trunc",
    type: "function",
    description: "Truncate decimal part",
    example: "trunc(3.9)",
    hint: "trunc(value)",
  },

  // Other functions
  {
    name: "min",
    type: "function",
    description: "Minimum of values",
    example: "min(2, 5, 1)",
    hint: "min(value1, value2, ...)",
  },
  {
    name: "max",
    type: "function",
    description: "Maximum of values",
    example: "max(2, 5, 1)",
    hint: "max(value1, value2, ...)",
  },
  {
    name: "factorial",
    type: "function",
    description: "Factorial",
    example: "factorial(5)",
    hint: "factorial(integer)",
  },

  // Angle conversion
  {
    name: "deg",
    type: "function",
    description: "Convert degrees to radians",
    example: "deg(45)",
    hint: "deg(degrees)",
  },
  {
    name: "rad",
    type: "function",
    description: "Convert radians to degrees",
    example: "rad(pi/4)",
    hint: "rad(radians)",
  },

  // Constants
  {
    name: "π",
    type: "constant",
    description: "Pi constant (≈3.14159)",
    example: "π × 2",
  },
  {
    name: "pi",
    type: "constant",
    description: "Pi constant (≈3.14159)",
    example: "pi × 2",
  },
  {
    name: "e",
    type: "constant",
    description: "Euler's number (≈2.71828)",
    example: "e^2",
  },

  // Metric prefixes
  {
    name: "kilo",
    type: "unit",
    description: "Metric prefix (×1000)",
    example: "5 kilo gram",
    hint: "Use before unit: kilo + gram = kilogram",
  },
  {
    name: "mega",
    type: "unit",
    description: "Metric prefix (×1,000,000)",
    example: "2 mega byte",
    hint: "Use before unit: mega + byte = megabyte",
  },
  {
    name: "giga",
    type: "unit",
    description: "Metric prefix (×1,000,000,000)",
    example: "1 giga byte",
    hint: "Use before unit: giga + byte = gigabyte",
  },
  {
    name: "milli",
    type: "unit",
    description: "Metric prefix (×0.001)",
    example: "500 milli gram",
    hint: "Use before unit: milli + gram = milligram",
  },
  {
    name: "micro",
    type: "unit",
    description: "Metric prefix (×0.000001)",
    example: "10 micro meter",
    hint: "Use before unit: micro + meter = micrometer",
  },
  {
    name: "nano",
    type: "unit",
    description: "Metric prefix (×0.000000001)",
    example: "50 nano meter",
    hint: "Use before unit: nano + meter = nanometer",
  },
  {
    name: "centi",
    type: "unit",
    description: "Metric prefix (×0.01)",
    example: "100 centi meter",
    hint: "Use before unit: centi + meter = centimeter",
  }, // Common units
  // Length units - Metric
  {
    name: "meter",
    type: "unit",
    description: "Length unit",
    example: "5 meter",
  },

  // Length units - Imperial
  {
    name: "foot",
    type: "unit",
    description: "Imperial length unit",
    example: "10 foot",
  },
  {
    name: "inch",
    type: "unit",
    description: "Imperial length unit (1/12 foot)",
    example: "12 inch",
  },
  {
    name: "yard",
    type: "unit",
    description: "Imperial length unit (3 feet)",
    example: "100 yard",
  },
  {
    name: "mile",
    type: "unit",
    description: "Imperial length unit (5280 feet)",
    example: "5 mile",
  },
  {
    name: "nautical_mile",
    type: "unit",
    description: "Maritime length unit",
    example: "20 nautical_mile",
  },
  {
    name: "fathom",
    type: "unit",
    description: "Maritime depth unit (6 feet)",
    example: "30 fathom",
  },

  // Astronomical length units
  {
    name: "lightyear",
    type: "unit",
    description: "Distance light travels in one year",
    example: "4.2 lightyear",
  },
  {
    name: "lightminute",
    type: "unit",
    description: "Distance light travels in one minute",
    example: "8 lightminute",
  },
  {
    name: "lightsecond",
    type: "unit",
    description: "Distance light travels in one second",
    example: "1.3 lightsecond",
  },
  {
    name: "parsec",
    type: "unit",
    description: "Astronomical unit (3.26 lightyears)",
    example: "1.3 parsec",
  },
  {
    name: "astronomical_unit",
    type: "unit",
    description: "Earth-Sun distance",
    example: "1.5 astronomical_unit",
  },

  // Mass units - Metric
  {
    name: "kg",
    type: "unit",
    description: "Mass unit (kilograms)",
    example: "2.5 kg",
  },
  {
    name: "gram",
    type: "unit",
    description: "Mass unit (1/1000 kg)",
    example: "500 gram",
  },

  // Mass units - Imperial
  {
    name: "pound",
    type: "unit",
    description: "Imperial mass unit",
    example: "150 pound",
  },
  {
    name: "ounce",
    type: "unit",
    description: "Imperial mass unit (1/16 pound)",
    example: "8 ounce",
  },
  {
    name: "stone",
    type: "unit",
    description: "British mass unit (14 pounds)",
    example: "10 stone",
  },
  {
    name: "ton",
    type: "unit",
    description: "Imperial mass unit (2000 pounds)",
    example: "2 ton",
  },

  // Time units
  {
    name: "second",
    type: "unit",
    description: "Time unit",
    example: "60 second",
  },
  {
    name: "minute",
    type: "unit",
    description: "Time unit",
    example: "30 minute",
  },
  {
    name: "hour",
    type: "unit",
    description: "Time unit",
    example: "2 hour",
  },
  {
    name: "day",
    type: "unit",
    description: "Time unit (24 hours)",
    example: "7 day",
  },
  {
    name: "week",
    type: "unit",
    description: "Time unit (7 days)",
    example: "2 week",
  },
  {
    name: "month",
    type: "unit",
    description: "Time unit (~30 days)",
    example: "6 month",
  },
  {
    name: "year",
    type: "unit",
    description: "Time unit (365 days)",
    example: "5 year",
  },
  {
    name: "decade",
    type: "unit",
    description: "Time unit (10 years)",
    example: "2 decade",
  },
  {
    name: "century",
    type: "unit",
    description: "Time unit (100 years)",
    example: "3 century",
  },
  {
    name: "millisecond",
    type: "unit",
    description: "Time unit (1/1000 second)",
    example: "500 millisecond",
  },
  {
    name: "microsecond",
    type: "unit",
    description: "Time unit (1/1,000,000 second)",
    example: "100 microsecond",
  },

  // Volume units - Metric
  {
    name: "liter",
    type: "unit",
    description: "Volume unit",
    example: "2.5 liter",
  },
  {
    name: "milliliter",
    type: "unit",
    description: "Volume unit (1/1000 liter)",
    example: "250 milliliter",
  },
  {
    name: "cubic_meter",
    type: "unit",
    description: "Volume unit",
    example: "10 cubic_meter",
  },

  // Volume units - Imperial
  {
    name: "gallon",
    type: "unit",
    description: "Imperial volume unit",
    example: "5 gallon",
  },
  {
    name: "quart",
    type: "unit",
    description: "Imperial volume unit (1/4 gallon)",
    example: "2 quart",
  },
  {
    name: "pint",
    type: "unit",
    description: "Imperial volume unit (1/2 quart)",
    example: "4 pint",
  },
  {
    name: "cup",
    type: "unit",
    description: "Imperial volume unit (1/2 pint)",
    example: "3 cup",
  },
  {
    name: "fluid_ounce",
    type: "unit",
    description: "Imperial volume unit (1/8 cup)",
    example: "8 fluid_ounce",
  },
  {
    name: "tablespoon",
    type: "unit",
    description: "Volume unit (1/2 fluid ounce)",
    example: "4 tablespoon",
  },
  {
    name: "teaspoon",
    type: "unit",
    description: "Volume unit (1/3 tablespoon)",
    example: "2 teaspoon",
  },

  // Area units
  {
    name: "square_meter",
    type: "unit",
    description: "Area unit",
    example: "100 square_meter",
  },
  {
    name: "square_foot",
    type: "unit",
    description: "Imperial area unit",
    example: "500 square_foot",
  },
  {
    name: "acre",
    type: "unit",
    description: "Area unit (43,560 sq ft)",
    example: "2.5 acre",
  },
  {
    name: "hectare",
    type: "unit",
    description: "Area unit (10,000 sq m)",
    example: "1.5 hectare",
  },

  // Temperature units
  {
    name: "celsius",
    type: "unit",
    description: "Temperature unit",
    example: "25 celsius",
  },
  {
    name: "fahrenheit",
    type: "unit",
    description: "Temperature unit",
    example: "77 fahrenheit",
  },
  {
    name: "kelvin",
    type: "unit",
    description: "Absolute temperature unit",
    example: "298 kelvin",
  },

  // Energy units
  {
    name: "joules",
    type: "unit",
    description: "Energy unit",
    example: "1000 joules",
  },
  {
    name: "calories",
    type: "unit",
    description: "Energy unit",
    example: "500 calories",
  },
  {
    name: "kilocalories",
    type: "unit",
    description: "Energy unit (1000 calories)",
    example: "2.5 kilocalories",
  },
  {
    name: "watts",
    type: "unit",
    description: "Power unit",
    example: "100 watts",
  },
  {
    name: "kilowatts",
    type: "unit",
    description: "Power unit (1000 watts)",
    example: "5 kilowatts",
  },
  {
    name: "horsepower",
    type: "unit",
    description: "Power unit (~746 watts)",
    example: "2.5 horsepower",
  },

  // Pressure units
  {
    name: "pascals",
    type: "unit",
    description: "Pressure unit",
    example: "101325 pascals",
  },
  {
    name: "atmospheres",
    type: "unit",
    description: "Pressure unit",
    example: "1.2 atmospheres",
  },
  {
    name: "psi",
    type: "unit",
    description: "Pressure unit (pounds per sq inch)",
    example: "30 psi",
  },
  {
    name: "torr",
    type: "unit",
    description: "Pressure unit (1/760 atmosphere)",
    example: "760 torr",
  },

  // Speed/Velocity units
  {
    name: "mph",
    type: "unit",
    description: "Speed unit (miles per hour)",
    example: "60 mph",
  },
  {
    name: "kph",
    type: "unit",
    description: "Speed unit (kilometers per hour)",
    example: "100 kph",
  },
  {
    name: "knots",
    type: "unit",
    description: "Speed unit (nautical miles per hour)",
    example: "25 knots",
  },
  {
    name: "mach",
    type: "unit",
    description: "Speed unit (speed of sound)",
    example: "2.5 mach",
  },

  // Frequency units
  {
    name: "hertz",
    type: "unit",
    description: "Frequency unit",
    example: "440 hertz",
  },
  {
    name: "kilohertz",
    type: "unit",
    description: "Frequency unit (1000 Hz)",
    example: "88.5 kilohertz",
  },
  {
    name: "megahertz",
    type: "unit",
    description: "Frequency unit (1,000,000 Hz)",
    example: "2.4 megahertz",
  },
  {
    name: "gigahertz",
    type: "unit",
    description: "Frequency unit (1,000,000,000 Hz)",
    example: "3.2 gigahertz",
  },

  // Data storage units
  {
    name: "byte",
    type: "unit",
    description: "Data storage unit",
    example: "1024 byte",
  },
  {
    name: "kilobyte",
    type: "unit",
    description: "Data storage unit",
    example: "500 kilobyte",
  },
  {
    name: "megabyte",
    type: "unit",
    description: "Data storage unit",
    example: "250 megabyte",
  },
  {
    name: "gigabyte",
    type: "unit",
    description: "Data storage unit",
    example: "8 gigabyte",
  },
  {
    name: "terabyte",
    type: "unit",
    description: "Data storage unit",
    example: "2 terabyte",
  },
  {
    name: "petabyte",
    type: "unit",
    description: "Data storage unit",
    example: "1.5 petabyte",
  },

  // Currency units (common ones)
  {
    name: "dollar",
    type: "unit",
    description: "Currency unit",
    example: "100 dollar",
  },
  {
    name: "euro",
    type: "unit",
    description: "Currency unit",
    example: "50 euros",
  },
  {
    name: "pounds_sterling",
    type: "unit",
    description: "Currency unit",
    example: "75 pounds_sterling",
  },
  {
    name: "yen",
    type: "unit",
    description: "Currency unit",
    example: "1000 yen",
  },

  // Fun/unusual units
  {
    name: "bananas",
    type: "unit",
    description: "Informal length unit (~7 inches)",
    example: "3 bananas",
  },
  {
    name: "football_fields",
    type: "unit",
    description: "Informal length unit (~100 yards)",
    example: "2 football_fields",
  },
  {
    name: "library_of_congress",
    type: "unit",
    description: "Data storage comparison (~15TB)",
    example: "5 library_of_congress",
  },
  {
    name: "olympic_pools",
    type: "unit",
    description: "Volume unit (~2500 cubic meters)",
    example: "0.5 olympic_pools",
  },

  // Operators
  {
    name: "×",
    type: "operator",
    description: "Multiplication",
    example: "5 × 3",
  },
  { name: "÷", type: "operator", description: "Division", example: "10 ÷ 2" },
  {
    name: "^",
    type: "operator",
    description: "Exponentiation",
    example: "2^3",
  },
];

export function getAutocompleteMatches(
  input: string,
  cursorPosition: number
): AutocompleteItem[] {
  if (!input) return [];

  // Get the word being typed at cursor position
  const beforeCursor = input.substring(0, cursorPosition);
  const words = beforeCursor.split(/[^a-zA-Z]/);
  const currentWord = words[words.length - 1].toLowerCase();

  if (currentWord.length < 1) return [];

  // Filter items that start with the current word
  return AUTOCOMPLETE_DATA.filter((item) =>
    item.name.toLowerCase().startsWith(currentWord)
  ).slice(0, 8); // Limit to 8 suggestions
}

export function getFunctionHint(input: string): string | null {
  // Check for functions without parameters or with incomplete parameters
  const functionPattern =
    /\b(sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|log|lg|ln|sqrt|cbrt|pow|exp|exp2|exp10|abs|floor|ceil|round|trunc|min|max|factorial|deg|rad)\s*\(\s*$/;
  const match = input.match(functionPattern);

  if (match) {
    const functionName = match[1];
    const functionData = AUTOCOMPLETE_DATA.find(
      (item) => item.name === functionName && item.type === "function"
    );
    return functionData?.hint || null;
  }

  return null;
}
