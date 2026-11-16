"use client";
import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { audioStore, enterAudioRoom, mountAudio, playSound, setAudioPreferences, unlockAudio } from "./audio";
import "./audio.css";
export function AudioLifecycle() { useEffect(mountAudio, []); return null; }
export function useRoomAudio(roomId: string | null) {
  useEffect(() => { if (roomId) return enterAudioRoom(); }, [roomId]);
}
export function AudioControls() {
  const settings = useSyncExternalStore(audioStore.subscribe, audioStore.getSnapshot, audioStore.getServerSnapshot);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return <><button ref={trigger} type="button" className="audio-trigger" aria-label="Cài đặt âm thanh" aria-haspopup="dialog" onClick={() => { unlockAudio(); dialog.current?.showModal(); }}>
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" />{settings.music || settings.effects ? <><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></> : <path d="m16 9 5 6m0-6-5 6" />}</svg>
  </button>
  <dialog ref={dialog} className="audio-dialog" aria-labelledby="audio-heading" onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
    <div className="audio-heading"><h2 id="audio-heading">Âm thanh</h2><button type="button" aria-label="Đóng cài đặt âm thanh" onClick={() => dialog.current?.close()}>×</button></div>
    <p className="audio-description">Một chút nhạc, thêm không khí cho bàn chơi.</p>
    {([{ toggle: "music", volume: "musicVolume", label: "Nhạc nền" }, { toggle: "effects", volume: "effectsVolume", label: "Hiệu ứng" }] as const).map(channel => <section className="audio-channel" key={channel.toggle}>
      <label className="audio-switch"><span>{channel.label}</span><input type="checkbox" checked={settings[channel.toggle]} onChange={event => { setAudioPreferences({ [channel.toggle]: event.target.checked }); unlockAudio(); }} /></label>
      <div className="audio-range"><input type="range" style={{ "--audio-level": settings[channel.volume] + "%" } as CSSProperties} min="0" max="100" step="1" aria-label={"Âm lượng " + channel.label.toLocaleLowerCase("vi")} value={settings[channel.volume]} onChange={event => setAudioPreferences({ [channel.volume]: Number(event.target.value) })} /><output>{settings[channel.volume]}%</output></div>
    </section>)}
    <button type="button" className="button secondary audio-preview" disabled={!settings.effects || settings.effectsVolume === 0} onClick={() => { unlockAudio(); playSound("uno"); }}>Nghe thử hiệu ứng</button>
    <p className="audio-note" role="status">{settings.error ? "Có âm thanh chưa tải được. Thử tải lại trang khi mạng ổn định." : !settings.ready ? "Chạm nút âm thanh để bật tiếng trên trình duyệt." : "Tùy chọn được lưu trên thiết bị. Tạm dừng khi bạn chuyển tab."}</p>
  </dialog></>;
}
