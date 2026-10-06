import { publishDueMission } from "@/lib/daily-missions";

export const dynamic = "force-dynamic";

export async function GET() {
  const published = await publishDueMission();
  return Response.json({ ok: true, published });
}
