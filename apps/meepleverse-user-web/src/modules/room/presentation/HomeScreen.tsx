import { RoomEntryForm } from "./RoomEntryForm";
export function HomeScreen() {
  return <main className="shell home-main">
    <div className="hero-grid"><div className="hero-copy">
      <div className="pill"><span className="status-dot" /> UNO cơ bản · 2–4 người</div>
      <h1>Đủ mặt rồi.<br /><span>Lên bàn thôi.</span></h1>
      <p className="hero-description">Một ván UNO, vài người bạn và những cú đổi chiều bất ngờ. Tạo phòng, gửi lời mời, cùng nhau bắt đầu.</p>
      <div className="card-scene" aria-hidden="true">
        <div className="orbit orbit-one" /><div className="orbit orbit-two" />
        <div className="demo-card card-green"><span>4</span><b>4</b><span>4</span></div>
        <div className="demo-card card-blue"><span>↶</span><b>↶</b><span>↶</span></div>
        <div className="demo-card card-red"><span>7</span><b>7</b><span>7</span></div>
        <div className="scene-caption"><span>✦</span> Gần nhau hơn, qua từng ván.</div>
      </div>
    </div><RoomEntryForm /></div>
    <section className="how-to" aria-label="Ba bước bắt đầu">
      <div><span className="step-number">01</span><h3>Tạo một phòng</h3><p>Chọn tên hiển thị và mở bàn UNO của bạn.</p></div>
      <div><span className="step-number">02</span><h3>Rủ hội bạn</h3><p>Gửi link mời hoặc mã phòng cho mọi người.</p></div>
      <div><span className="step-number">03</span><h3>Đủ người, bắt đầu</h3><p>Chủ phòng mở ván khi có từ 2 đến 4 người.</p></div>
    </section>
  </main>;
}
