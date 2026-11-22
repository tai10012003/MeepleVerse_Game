export function UnoChoicePrompt({ remaining, armed, disabled, onToggle }: {
  remaining: number; armed: boolean; disabled: boolean; onToggle: () => void;
}) {
  return <div className="expanded-choice-uno" data-testid="uno-choice-prompt">
    <div><strong>Sau lựa chọn này, bạn còn {remaining} lá.</strong><p>{armed ? "Đã hô UNO cho lựa chọn này." : "Hô UNO trước khi xác nhận để tránh phạt +2."}</p></div>
    <button type="button" aria-label="Hô UNO cho lựa chọn" className={armed ? "is-armed" : ""} aria-pressed={armed} disabled={disabled} onClick={onToggle}>UNO!{armed ? " · Đã hô" : ""}</button>
  </div>;
}
