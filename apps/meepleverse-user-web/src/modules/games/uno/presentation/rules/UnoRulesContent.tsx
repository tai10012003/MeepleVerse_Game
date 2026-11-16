export function UnoRulesContent() {
  return <>
    <section className="uno-rules-summary"><strong>Hết bài trước, thắng ván!</strong><p>2–4 người · 108 lá · Mỗi người bắt đầu với 7 lá</p><span>Áp dụng luật riêng MeepleVerse: cộng dồn +2/+4 và tự phạt khi quên UNO.</span></section>
    <section><h3>1. Bộ bài có những gì?</h3>
      <p>Bốn màu: <strong>đỏ, vàng, xanh lá, xanh dương</strong>. Mỗi màu có 25 lá; thêm 8 lá đen đa năng.</p>
      <div className="uno-rules-table"><table><caption>Thành phần bộ 108 lá</caption><thead><tr><th>Loại bài</th><th>Mỗi màu</th><th>Tổng</th></tr></thead><tbody>
        <tr><td>Số 0</td><td>1 lá</td><td>4 lá</td></tr><tr><td>Số 1–9</td><td>2 lá / số</td><td>72 lá</td></tr>
        <tr><td>Cấm lượt · Skip</td><td>2 lá</td><td>8 lá</td></tr><tr><td>Đảo chiều · Reverse</td><td>2 lá</td><td>8 lá</td></tr><tr><td>Rút hai · +2</td><td>2 lá</td><td>8 lá</td></tr>
        <tr><td>Đổi màu · Wild</td><td>Lá đen</td><td>4 lá</td></tr><tr><td>Đổi màu, rút bốn · +4</td><td>Lá đen</td><td>4 lá</td></tr>
      </tbody></table></div><p><strong>76 lá số + 24 lá chức năng theo màu + 8 lá đen = 108 lá.</strong> Có 5 loại chức năng, tổng cộng 32 lá. Bản này chưa có +8, ×2 hay ÷2.</p>
    </section>
    <section><h3>2. Bắt đầu một ván</h3><ol>
      <li>Nhập nickname, tạo phòng hoặc vào bằng mã/link mời. Chủ phòng bắt đầu khi có 2–4 người.</li>
      <li>Bài được xào và chia tự động, mỗi người <strong>7 lá</strong>. Bạn chỉ thấy mặt bài của mình; đối thủ chỉ hiện mặt sau và số lượng.</li>
      <li>Lật một <strong>lá số 0–9</strong> làm lá đầu tiên giữa bàn để xác định màu và số. Không mở ván bằng lá chức năng, không có phạt cộng từ lá mở đầu.</li>
      <li>Game chọn người chia bài ngẫu nhiên; ghế kế tiếp đi đầu, ban đầu theo chiều kim đồng hồ. Theo dõi avatar sáng và thông báo lượt.</li>
    </ol></section>
    <section><h3>3. Đến lượt mình làm gì?</h3><p>Mỗi lượt thường, bạn đánh <strong>1 lá</strong> cùng màu, cùng số hoặc cùng biểu tượng với lá trên cùng của bàn. Lá Wild và +4 có thể đánh bất kể màu.</p>
      <div className="uno-rules-example">Trên bàn là <strong>đỏ 5</strong>: bạn có thể đánh một lá đỏ, một lá số 5 màu khác, Wild hoặc +4.</div>
      <ul><li>Bấm chọn lá rồi bấm <strong>Đánh lá bài</strong>. Lá hợp lệ được gợi ý nâng lên; lá không hợp lệ bị làm mờ. Viền vàng chỉ lá đang chọn.</li>
      <li>Không đánh được hoặc muốn giữ bài? Bấm <strong>Bốc bài</strong> để rút đúng 1 lá, kể cả khi đang có lá đánh được.</li>
      <li>Nếu lá mới bốc đánh được: bạn chỉ được đánh <strong>chính lá vừa bốc</strong>, hoặc bấm <strong>Bỏ lượt</strong>. Không được đổi sang lá cũ hay bốc tiếp trong lượt đó.</li>
      <li>Nếu lá mới bốc không đánh được, game tự chuyển lượt. Không bốc liên tục cho tới khi có bài hợp lệ.</li></ul>
    </section>
    <section><h3>4. Tác dụng từng lá chức năng</h3><dl className="uno-rules-functions">
      <dt>⊘ Cấm lượt · 8 lá</dt><dd>Người kế tiếp mất lượt. Với 2 người, người vừa đánh được chơi tiếp.</dd>
      <dt>⇄ Đảo chiều · 8 lá</dt><dd>Đảo chiều vòng chơi. Với 2 người, có tác dụng như cấm lượt: người đánh được chơi tiếp.</dd>
      <dt>+2 Rút hai · 8 lá</dt><dd>Mở hoặc nối chuỗi phạt, tăng tổng phạt thêm 2. Người kế tiếp phải nối bằng +2/+4 hoặc nhận toàn bộ phạt và mất lượt.</dd>
      <dt>✦ Đổi màu · 4 lá</dt><dd>Đánh lên bất kỳ lá nào trong lượt thường và chọn một trong bốn màu ngay khi đánh. Không dùng để chặn chuỗi phạt.</dd>
      <dt>+4 Đổi màu, rút bốn · 4 lá</dt><dd>Tăng tổng phạt thêm 4. Được đánh tự do, kể cả khi bạn có bài cùng màu; <strong>không có thách thức +4</strong>. Nếu đây là lá cộng cuối chuỗi, chính người đánh +4 đó chọn màu sau khi người nhận đã bốc phạt.</dd>
    </dl></section>
    <section className="uno-rules-house"><h3>5. Luật nhà: cộng dồn +2 và +4</h3><ul>
      <li>Khi đang chịu phạt, chỉ được đánh <strong>+2 hoặc +4 bất kỳ màu</strong> để chuyển tổng phạt sang người tiếp theo. Có thể nối chéo +2 lên +4 và ngược lại.</li>
      <li>Không có lá cộng hoặc không muốn nối? Bấm <strong>Nhận N lá</strong>. Bạn bốc một lần toàn bộ tổng phạt và mất lượt; không được dùng bài vừa nhận để nối lại.</li>
      <li>Không được đánh số, Wild thường, cấm hay đảo chiều để né phạt; không được bốc 1 lá hoặc bỏ lượt trong chuỗi.</li>
      <li>Chuỗi kết thúc bằng <strong>+2</strong>: giữ màu của lá +2 cuối.</li>
      <li>Chuỗi kết thúc bằng <strong>+4</strong>: người đánh +4 cuối cùng chọn màu <strong>sau khi người nhận bốc phạt</strong>, rồi tới người sau người nhận theo chiều hiện hành.</li>
    </ul><div className="uno-rules-example"><strong>A +2 → B +4 → C +4 → D nhận 10 lá.</strong><br />C chọn màu, rồi tới A. D không được chọn màu.</div>
      <div className="uno-rules-example"><strong>A +4 → B +2 đỏ → C nhận 6 lá.</strong><br />Màu tiếp theo là đỏ; lượt chuyển tới người sau C.</div>
      <p>Mỗi lá cộng tối đa +4, nhưng <strong>tổng chuỗi có thể lớn hơn 4</strong>; không giới hạn ở một lá cộng.</p>
    </section>
    <section className="uno-rules-house"><h3>6. Nút UNO và phạt quên hô</h3><ul>
      <li>Nút <strong>UNO!</strong> luôn hiện. Khi còn đúng <strong>2 lá</strong>, nút sáng lên.</li>
      <li><strong>Bấm UNO trước khi đánh</strong> từ 2 lá xuống còn 1 lá. Bấm UNO chỉ chuẩn bị cho lần đánh, không tự đánh bài giúp bạn.</li>
      <li>Quên bấm và đánh xuống còn 1 lá: tự bốc thêm <strong>2 lá ngay lập tức</strong>. Không cần người khác bắt; bấm UNO sau khi đánh không xóa phạt.</li>
      <li>Phạt quên UNO tách riêng khỏi chuỗi cộng dồn. Lá bạn vừa đánh vẫn có tác dụng bình thường.</li>
      <li>Khi chỉ còn 1 lá và đánh lá cuối để thắng, không cần bấm UNO lần nữa.</li>
    </ul></section>
    <section><h3>7. Thắng ván và tính điểm</h3><p>Ai đánh hết bài trước thắng. <strong>Được phép về đích bằng lá chức năng hoặc lá đen.</strong></p><ul>
      <li>Nếu lá cuối là +2/+4, người kế tiếp tự nhận toàn bộ tổng phạt trước khi tính điểm, không được cộng tiếp. Ván kết thúc nên không cần chọn màu sau +4.</li>
      <li>Lá số tính theo số trên lá; cấm, đảo chiều và +2: <strong>20 điểm/lá</strong>; Wild và +4: <strong>50 điểm/lá</strong>.</li>
      <li>Điểm người thắng bằng tổng điểm bài còn trên tay các đối thủ. Mỗi ván độc lập; chưa chơi giải tích lũy tới 500 điểm.</li>
      <li>Hết chồng bốc: game xào lại các lá đã đánh, giữ lá trên cùng. Nếu không đủ bài, chỉ bốc số còn có thể bốc. Nếu cả vòng đều không bốc được lá nào trong lượt bốc thường, ván kết thúc không có người thắng.</li>
    </ul><p>Chủ phòng có thể bắt đầu ván mới ở màn hình kết quả.</p></section>
    <section><h3>8. Kết nối và mẹo xem bàn</h3><ul><li>Mất mạng: phòng giữ chỗ tối đa <strong>30 giây</strong> để kết nối lại; trong lúc chờ, ván tạm dừng.</li><li>Mũi tên cho biết chiều và màu hiện tại. Huy hiệu +N là tổng phạt đang chờ người nhận.</li><li>Nút loa cho phép chỉnh nhạc và hiệu ứng riêng. Bạn có thể mở lại hướng dẫn bằng nút <strong>?</strong> trong phòng.</li></ul><p className="uno-rules-footnote">Đây là luật UNO Cơ bản đang áp dụng trên MeepleVerse. Cộng dồn, cách chọn màu sau +4 và tự phạt quên UNO là luật riêng của bàn chơi này.</p></section>
  </>;
}
