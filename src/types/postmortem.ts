export interface Postmortem {
  id: string;
  incident_id: string;
  root_cause: string;
  resolution: string;
  lessons_learned: string;
  resolution_time_minutes: number;
  created_at: string;
}

export interface CreatePostmortemInput {
  incident_id: string;
  root_cause: string;
  resolution: string;
  lessons_learned: string;
  resolution_time_minutes: number;
}
