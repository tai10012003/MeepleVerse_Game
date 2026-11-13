import { HealthCheck } from "@/shared/api/HealthCheck";
export default function HomePage() {
  return <main><p>meepleverse-admin-portal · port 9000</p><h1>MeepleVerse Admin</h1>
    <p>Nền kỹ thuật đã sẵn sàng. Chức năng quản trị sẽ được xây dựng ở các bước tiếp theo.</p>
    <HealthCheck /></main>;
}
