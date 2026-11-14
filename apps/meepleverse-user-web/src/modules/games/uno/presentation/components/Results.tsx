import type { UnoRoomView } from "@meepleverse/contracts/room";
export function Results({ view, pending, enabled, onRematch, onLeave }: {
  view: UnoRoomView; pending: boolean; enabled: boolean; onRematch: () => void; onLeave: () => void;
}) {
  const winnerId = view.outcome?.winnerId ?? view.game?.result?.winnerId;
  const name = view.members.find(member => member.playerId === winnerId)?.nickname;
  const isWinner = winnerId === view.selfPlayerId;
  const host = view.hostId === view.selfPlayerId;
  const interrupted = view.outcome?.reason === "player-left" || view.outcome?.reason === "reconnection-expired";
  return <section className="uno-results" aria-label="Kết quả ván">
    <span className="result-spark" aria-hidden="true">✦</span><span className="eyebrow">Kết thúc ván</span>
    <h1>{isWinner ? "Bạn thắng rồi!" : winnerId ? name + " thắng ván này!" : "Ván chơi đã kết thúc."}</h1>
    <p>{interrupted ? "Có người đã rời phòng hoặc hết thời gian kết nối lại." : view.game?.result?.reason === "blocked" ? "Không còn bài để bốc. Ván này không có người thắng." : "Một ván thật vui. Cùng chơi thêm ván nữa nhé?"}</p>
    {view.game?.result && <><div className="winner-score"><strong>{view.game.result.winnerScore}</strong><span>ĐIỂM NGƯỜI THẮNG</span></div>
      <ul className="score-list" aria-label="Điểm bài còn lại">{view.game.players.map(player => <li key={player.playerId}><span>{view.members.find(member => member.playerId === player.playerId)?.nickname ?? "Người chơi"}</span><strong>{view.game!.result!.handPoints[player.playerId] ?? 0} điểm bài</strong></li>)}</ul></>}
    <div className="result-actions">{host ? <button className="button primary" disabled={!enabled || pending || view.members.length < 2} onClick={onRematch}>{pending ? "Đang chia bài…" : "Chơi ván mới"}</button> : <p>Chờ chủ phòng mở ván mới.</p>}
      <button className="button secondary" onClick={onLeave}>Rời phòng</button></div>
    {view.members.length < 2 && <p className="form-note">Rời phòng và tạo phòng mới để mời thêm bạn.</p>}
  </section>;
}
