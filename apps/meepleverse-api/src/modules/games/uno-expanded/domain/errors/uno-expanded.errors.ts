import type { UnoExpandedErrorCode } from "@meepleverse/contracts/uno-expanded";
export class UnoExpandedRuleError extends Error {
  constructor(public readonly code: UnoExpandedErrorCode) { super(code); this.name = "UnoExpandedRuleError"; }
}
export function requireExpanded(condition: unknown, code: UnoExpandedErrorCode): asserts condition {
  if (!condition) throw new UnoExpandedRuleError(code);
}
