export type RecurrenceType = "daily" | "weekly" | "custom_dates" | "once";
export type Priority = "low" | "medium" | "high";
export type LogStatus = "done" | "missed" | "pending";
export type AirdropStatus = "claimed" | "pending" | "missed";
export type TaskCategory =
  | "transaction"
  | "liquidity_check"
  | "daily_checkin"
  | "discord"
  | "tweet"
  | "content"
  | "custom";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          username: string | null;
          locale: string;
          theme: string;
          timezone: string;
          week_start: number;
          show_quotes: boolean;
          clock_size: string;
          banner_speed: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      quotes: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quotes"]["Row"]> & { user_id: string; text: string };
        Update: Partial<Database["public"]["Tables"]["quotes"]["Row"]>;
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
      };
      task_templates: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          title: string;
          description: string | null;
          recurrence_type: RecurrenceType;
          recurrence_days: number[] | null;
          custom_dates: string[] | null;
          start_date: string;
          end_date: string | null;
          priority: Priority;
          category: TaskCategory;
          emoji: string;
          active: boolean;
          archived: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["task_templates"]["Row"]> & {
          user_id: string;
          project_id: string;
          title: string;
          recurrence_type: RecurrenceType;
        };
        Update: Partial<Database["public"]["Tables"]["task_templates"]["Row"]>;
      };
      task_logs: {
        Row: {
          id: string;
          user_id: string;
          task_template_id: string;
          log_date: string;
          status: LogStatus;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["task_logs"]["Row"]> & {
          user_id: string;
          task_template_id: string;
          log_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["task_logs"]["Row"]>;
      };
      airdrops: {
        Row: {
          id: string;
          user_id: string;
          project_name: string;
          claim_date: string;
          value_text: string | null;
          value_usd: number | null;
          status: AirdropStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["airdrops"]["Row"]> & {
          user_id: string;
          project_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["airdrops"]["Row"]>;
      };
    };
  };
}
