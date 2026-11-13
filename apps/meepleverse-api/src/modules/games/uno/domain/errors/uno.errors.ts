import type { UnoErrorCode } from "@meepleverse/contracts/uno";
export class UnoRuleError extends Error {
  constructor(public readonly code: UnoErrorCode) {
    super(code);
    this.name = "UnoRuleError";
  }
}
export function requireRule(condition: unknown, code: UnoErrorCode): asserts condition {
  if (!condition) throw new UnoRuleError(code);
}
