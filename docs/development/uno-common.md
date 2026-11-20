# Shared UNO foundation

The Basic and Expanded editions own their rules and state. The common modules contain card vocabulary, physical deck operations and presentation primitives only.

## Dependencies

```text
contracts/uno-common <- contracts/uno, contracts/uno-expanded
API games/uno-common <- API games/uno, future Expanded gameplay
web games/uno-common <- web games/uno, future Expanded UI
```

Common code must not import either edition. There is no generic game engine or shared mutable match state.

## Contracts

Import `UnoColor`, `UnoDirection`, `UnoStandardCard` and `UNO_COLORS` from `@meepleverse/contracts/uno-common`. The existing `@meepleverse/contracts/uno` exports keep `UnoCard` as an alias for the standard union, preserving Basic consumers. Expanded extends that foundation in its own subpath; its special card kinds cannot enter Basic commands.

## Backend

`apps/meepleverse-api/src/modules/games/uno-common/index.ts` exposes:

- `shuffle` and `randomIndex`: caller-provided random source, no mutation of input; an optional invalid-random handler lets an edition retain its domain errors.
- `getNextPlayer`: seat arithmetic, direction and number of skipped steps.
- `drawFromStock`: moves physical cards into a supplied hand, recycles the discard pile while retaining its top, returns the actual cards drawn. An exhausted stock returns a partial draw. Callers validate counts before calling.
- `cardPoints`: default number/colored-action/wild scoring (value/20/50). Printed numbers on special cards are not pure number cards. Editions can supply other scoring policies later.

Basic adapters keep public imports, `UnoRuleError` identity, random-call order and `CARDS_DRAWN` events. Turn validation, stacking, delayed +4 color choice, UNO penalties, opening-number selection, phases, events, privacy and results remain in Basic. Expanded now has its own internal turn engine and draw/defense rules; production registration remains disabled. See [step 5](uno-expanded-draw-defense.md). See [Expanded foundation](uno-expanded-foundation.md).

## Frontend

Import `CardBack`, `OpponentHand`, `DirectionRing`, `DrawDebt`, `ColorPicker` and `colorNames` from `@/modules/games/uno-common`.

Shared CSS provides artwork and primitive defaults. An edition owns table geometry and seat variables (`--back-size`, `--fan-step`, `--fan-max`). Components receive public data via props and do not connect to rooms or know gameplay rules. Hands, effects scheduling, audio and rules guides remain in Basic until a second consumer establishes what should be shared. Step 8 moves the unchanged standard SVG vectors to common; each edition still owns its face wrapper and presentation labels.

## Verification

Shared unit tests exercise deterministic shuffle/error compatibility, seat wrapping, stock exhaustion, recycling and conservation of all physical IDs for both 108 and 198 cards. Existing Basic unit/integration tests protect the rules. Browser tests cover table geometry, color selection, debt indicators, synchronized effects, unique SVG card-back references, privacy and complete multiplayer matches.

## Shared room transport

`modules/room/presentation/colyseus/GameRoom.ts` now owns the transport lifecycle for both editions: private room codes, strict nickname handling, reconnection, bounded request receipts, duplicate/conflicting request handling, and per-client view delivery. Each edition supplies its own service, action parser, public schema mapper and error classifier. No rule or card type is accepted through a Basic cast.

`contracts/room-common` contains room metadata, common error codes, join validation and the generic action reply. Public views identify editions through `gameId`; the existing Basic matchmaking name remains `uno` for compatibility.

Expanded step 6 reuses the same turn engine and physical pile operations for atomic hand reductions and transfers; see [discard and turn rules](uno-expanded-discard-turns.md). The common module and Basic rules do not need edition-specific branches.

Expanded step 7 keeps Up/Battle/High Five state, timers and concurrency policy in the Expanded edition; see [mini-games](uno-expanded-minigames.md). Shared room transport exposes protected publication/event hooks; only the Expanded adapter schedules an effect timer. Basic uses the default no-op hook. Common card operations and Basic rules do not import mini-game logic.

Expanded step 8 reuses common standard artwork through a compatibility re-export for Basic; see [card artwork and development preview](uno-expanded-card-artwork.md). Expanded symbols and the development-only gallery remain in their edition, with no rule or room dependency.
