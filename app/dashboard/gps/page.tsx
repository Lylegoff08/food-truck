import { GpsDashboard } from "@/components/gps-dashboard";
import { requireSession } from "@/lib/auth/server";

export default async function GpsPage() {
  await requireSession();
  return <GpsDashboard />;
}
