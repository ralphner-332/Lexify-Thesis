/**
 * Lexify Mandatory Custom Rounding Rule & Scoring Calculations
 *
 * Rules:
 * 1. Rubric Criteria: Form (15%), Answer (15%), Rule (30%), Application (30%), Conclusion (10%).
 *    Individual criteria retain decimal precision without premature rounding.
 *
 * 2. 5-Point Scale Total per Question:
 *    - Calculate all five weighted criteria first (sum out of 100).
 *    - Convert the final weighted percentage into the 5-point scale (score * 0.05).
 *    - Custom Rounding:
 *      - Decimal portion <= 0.50: ROUND DOWN
 *      - Decimal portion > 0.50: ROUND UP
 *      - At exactly .50, ALWAYS round down.
 *
 *    Examples:
 *    - 5.00 -> 5
 *    - 4.55 -> 5
 *    - 4.51 -> 5
 *    - 4.50 -> 4
 *    - 3.55 -> 4
 *    - 3.50 -> 3
 *    - 2.55 -> 3
 *    - 2.50 -> 2
 *    - 2.45 -> 2
 *
 * 3. Overall Weighted Score (/50):
 *    - SUM of the 10 rounded question Total scores (whole number out of 50).
 *    - Example: 5 + 4 + 4 + 3 + 3 + 2 + 4 + 5 + 3 + 4 = 37/50.
 *    - Evaluated independently per model (Llama 3.2, Phi-4 mini, Gemma 2).
 */

/**
 * Rounds a 5-point score (0.00 - 5.00) using Lexify custom rounding:
 * Decimal portion <= 0.50 -> ROUND DOWN
 * Decimal portion > 0.50 -> ROUND UP
 * At exactly .50 -> ALWAYS round down
 */
export function roundToCustomFivePoint(scoreOutOfFive: number): number {
  if (!scoreOutOfFive || isNaN(scoreOutOfFive) || scoreOutOfFive <= 0) return 0;
  if (scoreOutOfFive >= 5) return 5;

  // Scale by 1e6 to eliminate IEEE-754 floating-point inaccuracies
  const roundedPrecise = Math.round(scoreOutOfFive * 1000000) / 1000000;
  const intPart = Math.floor(roundedPrecise);
  const decPart = Math.round((roundedPrecise - intPart) * 1000000) / 1000000;

  if (decPart > 0.50) {
    return Math.min(5, intPart + 1);
  } else {
    return intPart;
  }
}

/**
 * Converts a raw weighted percentage (0 - 100) into a custom rounded 5-point whole number score (0 - 5).
 */
export function percentageToCustomFivePoint(weightedPercentage: number): number {
  if (!weightedPercentage || isNaN(weightedPercentage) || weightedPercentage <= 0) return 0;
  const unroundedOutOfFive = weightedPercentage * 0.05;
  return roundToCustomFivePoint(unroundedOutOfFive);
}

/**
 * Sums the 5 rubric criteria (Form, Answer, Rule, Application, Conclusion) and returns the custom rounded 5-point score.
 */
export function criteriaToCustomFivePoint(
  criteria: Array<{ score?: number; rawScore?: number } | undefined | null>
): number {
  const sum = criteria.reduce((acc, c) => acc + (Number(c?.score ?? c?.rawScore ?? 0) || 0), 0);
  return percentageToCustomFivePoint(sum);
}

/**
 * Calculates the Overall Weighted Score out of 50 as the SUM of the rounded question scores.
 */
export function calculateOverallWeightedScore(
  scores: number[],
  areValuesOutOfFive?: boolean
): number {
  const isOutOfFive =
    areValuesOutOfFive !== undefined
      ? areValuesOutOfFive
      : scores.every((s) => s <= 5);

  return scores.reduce((sum, val) => {
    const rounded = isOutOfFive ? roundToCustomFivePoint(val) : percentageToCustomFivePoint(val);
    return sum + rounded;
  }, 0);
}
