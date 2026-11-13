import { z } from "zod";
import { UNO_COLORS } from "./card.js";
const color = z.enum(UNO_COLORS);
export const unoCommandSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("PLAY_CARD"), cardId: z.string().min(1).max(100), chosenColor: color.optional(), declareUno: z.boolean().optional() }),
  z.strictObject({ type: z.literal("DRAW_CARD") }),
  z.strictObject({ type: z.literal("PASS_TURN") }),
  z.strictObject({ type: z.literal("CHOOSE_COLOR"), color }),
  z.strictObject({ type: z.literal("ACCEPT_DRAW_FOUR") }),
  z.strictObject({ type: z.literal("CHALLENGE_DRAW_FOUR") }),
  z.strictObject({ type: z.literal("CALL_UNO") }),
  z.strictObject({ type: z.literal("CATCH_UNO"), targetId: z.string().min(1).max(100) }),
]);
export type UnoCommand = z.infer<typeof unoCommandSchema>;
