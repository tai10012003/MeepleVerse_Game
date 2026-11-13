import { RoomScreen } from "@/modules/room/presentation/RoomScreen";
export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoomScreen roomId={id.toUpperCase()} />;
}
