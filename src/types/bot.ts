export interface Bot {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  description: string;
  forwarding_email: string;
  assistant_id: string | null;
  user_id: string;
}