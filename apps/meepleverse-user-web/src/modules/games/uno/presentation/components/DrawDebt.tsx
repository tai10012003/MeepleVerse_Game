export function DrawDebt({ count, playerId }: { count: number; playerId: string }) {
  return <span className="draw-debt" role="status" aria-label={"Tổng phạt: " + count + " lá"} data-testid="draw-debt" data-player-id={playerId}>+{count}</span>;
}
