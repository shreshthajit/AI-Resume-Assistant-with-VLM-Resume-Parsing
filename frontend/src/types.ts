// types.ts
export interface ParsedResume {
  contact_info: Record<string, any>;
  summary: string | null;
  education: any[];
  work_experience: any[];
  technical_skills: Record<string, any>;
  projects: any[];
}

export interface ChatHistoryItem {
  resume_id: string;
  resume_name: string;
  last_message: string;
  last_message_at: string;
}