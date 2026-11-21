import { GameRulesButton } from "@/shared/ui/rules/GameRulesButton";
import { ExpandedRulesContent } from "./ExpandedRulesContent";
import "./expanded-rules.css";
export function ExpandedRulesButton({ compact = false }: { compact?: boolean }) {
  return <GameRulesButton compact={compact} label="Luật chơi UNO Mở rộng" className="expanded-rules-dialog" footer="Ván và đồng hồ mini-game vẫn tiếp tục khi đọc."><ExpandedRulesContent /></GameRulesButton>;
}
