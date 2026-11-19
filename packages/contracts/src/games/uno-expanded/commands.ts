import { z } from "zod";
import { UNO_COLORS } from "../uno-common/card.js";
// Reserved base command shapes. The foundation rejects all gameplay commands explicitly.
export const unoExpandedCommandSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("PLAY_CARD"), cardId: z.string().min(1).max(100), chosenColor: z.enum(UNO_COLORS).optional(), declareUno: z.boolean().optional() }),
  z.strictObject({ type: z.literal("DRAW_CARD") }),
  z.strictObject({ type: z.literal("PASS_TURN") }),
  z.strictObject({ type: z.literal("CHOOSE_COLOR"), color: z.enum(UNO_COLORS) }),
  z.strictObject({ type: z.literal("ACCEPT_DRAW_PENALTY") }),
]);
export type UnoExpandedCommand = z.infer<typeof unoExpandedCommandSchema>;
