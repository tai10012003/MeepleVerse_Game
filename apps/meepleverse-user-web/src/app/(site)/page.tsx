import { HealthCheck } from "@/shared/api/HealthCheck";
export default function HomePage() {
  return <main><p>meepleverse-user-web · port 3000</p><h1>MeepleVerse</h1>
    <p>Nền kỹ thuật đã sẵn sàng. Chức năng chơi game sẽ được xây dựng ở các bước tiếp theo.</p>
    <HealthCheck /></main>;
}
