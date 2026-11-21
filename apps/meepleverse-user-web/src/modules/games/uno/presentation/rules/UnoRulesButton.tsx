import { GameRulesButton } from "@/shared/ui/rules/GameRulesButton";
import { UnoRulesContent } from "./UnoRulesContent";
export function UnoRulesButton({ compact = false }: { compact?: boolean }) {
  return <GameRulesButton compact={compact} label="Luật chơi UNO Cơ bản"><UnoRulesContent /></GameRulesButton>;
}
