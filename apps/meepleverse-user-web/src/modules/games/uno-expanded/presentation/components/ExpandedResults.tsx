import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
export function ExpandedResults({ view, enabled, pending, onRematch, onLeave }: { view: UnoExpandedRoomView; enabled: boolean; pending: boolean; onRematch: () => void; onLeave: () => void }) {
  const winnerId = view.outcome?.winnerId ?? view.game?.result?.winnerId;
  const winner = view.members.find(member => member.playerId === winnerId)?.nickname ?? "Người chơi";
  const result = view.game?.result;
  return <section className="expanded-results" aria-label="Kết quả ván"><span className="eyebrow">UNO Mở rộng · Kết thúc ván</span><h1>{winnerId === view.selfPlayerId ? "Bạn thắng rồi!" : winnerId ? `${winner} thắng ván này!` : "Ván chơi đã kết thúc."}</h1>
    <p>{view.outcome?.reason === "player-left" || view.outcome?.reason === "reconnection-expired" ? "Có người đã rời phòng hoặc hết thời gian kết nối lại." : result?.reason === "simultaneous-finish" ? "Hai người cùng hết bài trong Battle. Ván này hòa." : result?.reason === "blocked" ? "Không còn nước đi hoặc bài để bốc." : "Cùng chơi thêm ván nữa nhé?"}</p>
    {result && <><strong className="expanded-result-score">{result.winnerScore} điểm</strong><ul aria-label="Điểm bài còn lại">{view.members.map(member => <li key={member.playerId}><span>{member.nickname}</span><strong>{result.handPoints[member.playerId] ?? 0} điểm bài</strong></li>)}</ul></>}
    <div className="result-actions">{view.hostId === view.selfPlayerId ? <button className="button primary" disabled={!enabled || pending || view.members.length < 2} onClick={onRematch}>{pending ? "Đang chia bài…" : "Chơi ván mới"}</button> : <p>Chờ chủ phòng mở ván mới.</p>}<button className="button secondary" onClick={onLeave}>Rời phòng</button></div>
  </section>;
}
