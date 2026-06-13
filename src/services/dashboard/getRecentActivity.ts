import { supabase } from "@/lib/supabase";

export interface ActivityItem {
  type: "incident" | "learning" | "postmortem";
  title: string;
  timestamp: string;
  meta?: string;
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = [];

  // Recent incidents
  const { data: incidents } = await supabase
    .from("incidents")
    .select("title, severity, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  for (const inc of incidents || []) {
    activities.push({
      type: "incident",
      title: inc.title,
      timestamp: inc.created_at,
      meta: inc.severity,
    });
  }

  // Recent learning events
  const { data: learnings } = await supabase
    .from("learning_events")
    .select("threat_type, created_at, status")
    .order("created_at", { ascending: false })
    .limit(5);

  for (const le of learnings || []) {
    activities.push({
      type: "learning",
      title: `Knowledge Learned: ${le.threat_type || "Unknown"}`,
      timestamp: le.created_at,
      meta: le.status,
    });
  }

  // Recent postmortems
  const { data: postmortems } = await supabase
    .from("postmortems")
    .select("root_cause, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  for (const pm of postmortems || []) {
    activities.push({
      type: "postmortem",
      title: `Postmortem: ${pm.root_cause.substring(0, 80)}...`,
      timestamp: pm.created_at,
    });
  }

  // Sort all by timestamp, most recent first
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return activities.slice(0, 10);
}
