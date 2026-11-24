"use client";
import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { cardGallery } from "../../model/card-gallery";
import { expandedCardName } from "../../model/card-presentation";
import { ExpandedCardFace } from "../cards/ExpandedCardFace";
import "./card-gallery.css";
type ColorFilter = "all" | "red" | "yellow" | "green" | "blue" | "wild";
const colorOptions: Array<[ColorFilter, string]> = [["all", "Tất cả màu"], ["red", "Đỏ"], ["yellow", "Vàng"], ["green", "Xanh lá"], ["blue", "Xanh dương"], ["wild", "Đen / Wild"]];
export function CardGallery() {
  const [edition, setEdition] = useState<"all" | "base" | "expanded">("all");
  const [color, setColor] = useState<ColorFilter>("all");
  const [size, setSize] = useState(86);
  const groups = cardGallery.filter(group => edition === "all" || group.edition === edition).map(group => ({ ...group,
    faces: group.faces.filter(face => color === "all" || (face.color ?? "wild") === color) })).filter(group => group.faces.length);
  return <main className="card-studio" style={{ "--preview-card-size": `${size}px` } as CSSProperties}>
    <header className="studio-header"><Link href="/" className="brand">Meeple<span className="brand-accent">Verse</span></Link><span className="studio-private">Xưởng thiết kế · nội bộ</span></header>
    <section className="studio-hero" aria-labelledby="studio-title">
      <div><span className="eyebrow">Bộ bài / Ấn bản mở rộng</span><h1 id="studio-title">Quen mặt bài.<br /><em>Thêm bất ngờ.</em></h1>
        <p>Storm, Battle và Infinity trong cùng một bộ bài. Xem từng biểu tượng, từng màu và từng kích thước trước khi vào bàn.</p>
        <div className="studio-stats"><span><strong>202</strong>lá trong bộ</span><span><strong>15</strong>nhóm mới</span><span><strong>4</strong>màu quen thuộc</span></div>
      </div>
      <div className="studio-fan" aria-label="Ba mặt bài tiêu biểu">
        <ExpandedCardFace card={{ kind: "wild-up", color: null }} /><ExpandedCardFace card={{ kind: "wild-shield", color: null }} /><ExpandedCardFace card={{ kind: "wild-target-four", color: null }} />
      </div>
    </section>
    <div className="studio-note"><span aria-hidden="true">✦</span><p><strong>Thư viện mặt bài.</strong> UNO Mở rộng đã mở chơi thử trên trang game.</p><Link href="/games/uno-expanded">Giới thiệu game ↗</Link></div>
    <section className="studio-library" aria-labelledby="library-title">
      <div className="studio-library-heading"><h2 id="library-title">Thư viện mặt bài</h2><span aria-live="polite">{groups.length} nhóm · {groups.reduce((sum, group) => sum + group.faces.length, 0)} mẫu</span></div>
      <div className="studio-controls">
        <fieldset><legend>Phiên bản</legend><div className="studio-segments">{([["all", "Tất cả"], ["expanded", "Mở rộng"], ["base", "Cơ bản"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={edition === value} onClick={() => setEdition(value)}>{label}</button>)}</div></fieldset>
        <div className="studio-select"><label htmlFor="studio-color">Màu bài</label><select id="studio-color" value={color} onChange={event => setColor(event.target.value as ColorFilter)}>{colorOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <fieldset><legend>Kích thước xem</legend><div className="studio-segments">{([[64, "Nhỏ"], [86, "Tay bài / trên bàn"], [144, "Phóng lớn"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={size === value} onClick={() => setSize(value)}>{label}</button>)}</div></fieldset>
      </div>
      <div className="studio-groups">{groups.map(group => <section className="studio-group" key={group.key} data-card-group={group.key} aria-label={group.name}>
        <div className="studio-group-copy"><span className="eyebrow">{group.reference}</span><h3>{group.name}</h3><p>{group.note}</p></div>
        <div className="studio-card-grid">{group.faces.map((face, index) => <figure key={`${face.kind}-${face.color}-${index}`}>
          <ExpandedCardFace card={face} /><figcaption>{expandedCardName(face)}</figcaption>
        </figure>)}</div>
      </section>)}</div>
    </section>
    <section className="studio-table-section" aria-labelledby="table-preview-title"><div><span className="eyebrow">Cùng một tỷ lệ</span><h2 id="table-preview-title">Trên tay hay trên bàn.</h2><p>Mặt bài dùng cùng kích thước ở cả hai vị trí. Biểu tượng và ký hiệu góc co giãn cùng nhau.</p></div>
      <div className="studio-table-demo"><div className="studio-demo-pile" aria-label="Mẫu bài trên bàn">
        <ExpandedCardFace card={{ kind: "high-five", color: "red", value: 5 }} /><ExpandedCardFace card={{ kind: "seven-change-right", color: "blue", value: 7 }} /><ExpandedCardFace card={{ kind: "wild-shield", color: null }} />
      </div><div className="studio-demo-hand" aria-label="Mẫu bài trên tay">
        <ExpandedCardFace card={{ kind: "tornado", color: "green" }} /><ExpandedCardFace card={{ kind: "wild-battle", color: null }} /><ExpandedCardFace card={{ kind: "discard-color", color: "yellow" }} /><ExpandedCardFace card={{ kind: "wild-divide-two", color: null }} />
      </div></div>
    </section>
    <footer className="studio-footer"><span>MeepleVerse · UNO Mở rộng</span><span>112 lá số · 32 chức năng nền · 58 mở rộng</span><Link href="/games">Khám phá game ↗</Link></footer>
  </main>;
}
