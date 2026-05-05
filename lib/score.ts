import { IMPORTANCE_WEIGHT } from "./prompts/extractCriteria.v1";
import type { CriterionMatch } from "./applications-store";

export function computeMatchScore(breakdown: CriterionMatch[]): number {
  if (breakdown.length === 0) return 0;
  const maxPossible = breakdown.reduce(
    (sum, c) => sum + IMPORTANCE_WEIGHT[c.importance] * 10,
    0
  );
  if (maxPossible === 0) return 0;
  const actual = breakdown.reduce(
    (sum, c) => sum + IMPORTANCE_WEIGHT[c.importance] * c.score,
    0
  );
  return Math.round((actual / maxPossible) * 100);
}
