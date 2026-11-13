"use client";
import { useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function requestHealth(signal?: AbortSignal): Promise<string> {
  try {
    const response = await fetch(new URL("/health", apiUrl), {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("status" in data) || data.status !== "ok") {
      throw new Error("Phản hồi không hợp lệ");
    }
    return "Kết nối API thành công.";
  } catch {
    return "Chưa kết nối được API. Hãy kiểm tra backend và thử lại.";
  }
}

export function HealthCheck() {
  const [state, setState] = useState({ pending: true, message: "Đang kiểm tra…" });

  useEffect(() => {
    const controller = new AbortController();
    void requestHealth(controller.signal).then(message => {
      if (!controller.signal.aborted) setState({ pending: false, message });
    });
    return () => controller.abort();
  }, []);

  async function retry() {
    setState({ pending: true, message: "Đang kiểm tra…" });
    const message = await requestHealth();
    setState({ pending: false, message });
  }

  return <section aria-label="Kết nối backend">
    <h2>Trạng thái API</h2>
    <p><code>{apiUrl}/health</code></p>
    <p role="status" aria-live="polite">{state.message}</p>
    <button disabled={state.pending} onClick={() => void retry()}>Kiểm tra lại</button>
  </section>;
}
