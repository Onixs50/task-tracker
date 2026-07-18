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
  | "telegram_push"
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
          announcement_views: Record<string, number>;
          telegram_chat_id: string | null;
          telegram_username: string | null;
          telegram_link_code: string | null;
          telegram_reminders_enabled: boolean;
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
          link_url: string | null;
          extra_links: string[];
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
      announcements: {
        Row: {
          id: string;
          title: string | null;
          message: string;
          active: boolean;
          max_views: number;
          accent: "gold" | "teal" | "danger";
          show_mascot: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["announcements"]["Row"]> & { message: string };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Row"]>;
      };
      telegram_broadcasts: {
        Row: {
          id: string;
          message: string;
          sent_by: string | null;
          recipient_count: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["telegram_broadcasts"]["Row"]> & { message: string };
        Update: Partial<Database["public"]["Tables"]["telegram_broadcasts"]["Row"]>;
      };
      task_reminders: {
        Row: {
          id: string;
          task_template_id: string;
          user_id: string;
          reminder_type: "once" | "daily_at" | "interval";
          time_of_day: string | null;
          interval_hours: number | null;
          next_send_at: string;
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["task_reminders"]["Row"]> & {
          task_template_id: string;
          user_id: string;
          reminder_type: "once" | "daily_at" | "interval";
          next_send_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["task_reminders"]["Row"]>;
      };
      shared_bundles: {
        Row: {
          id: string;
          created_by: string;
          from_username: string | null;
          payload: SharedTaskPayload[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shared_bundles"]["Row"]> & {
          created_by: string;
          payload: SharedTaskPayload[];
        };
        Update: Partial<Database["public"]["Tables"]["shared_bundles"]["Row"]>;
      };
      received_tasks: {
        Row: {
          id: string;
          recipient_id: string;
          from_username: string | null;
          bundle_id: string | null;
          title: string;
          description: string | null;
          link_url: string | null;
          extra_links: string[];
          category: TaskCategory;
          emoji: string;
          recurrence_type: RecurrenceType;
          recurrence_days: number[] | null;
          custom_dates: string[] | null;
          priority: Priority;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["received_tasks"]["Row"]> & {
          recipient_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["received_tasks"]["Row"]>;
      };
      telegram_sessions: {
        Row: {
          chat_id: string;
          user_id: string | null;
          lang: string;
          state: string;
          draft: Record<string, unknown>;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["telegram_sessions"]["Row"]> & { chat_id: string };
        Update: Partial<Database["public"]["Tables"]["telegram_sessions"]["Row"]>;
      };
      feedback_messages: {
        Row: {
          id: string;
          user_id: string | null;
          chat_id: string;
          username: string | null;
          message: string;
          admin_message_ids: Record<string, number>;
          admin_reply: string | null;
          status: "open" | "answered";
          created_at: string;
          replied_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["feedback_messages"]["Row"]> & {
          chat_id: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["feedback_messages"]["Row"]>;
      };
      telegram_bot_settings: {
        Row: {
          id: string;
          intro_text_fa: string | null;
          intro_text_en: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["telegram_bot_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["telegram_bot_settings"]["Row"]>;
      };
      site_admins: {
        Row: {
          email: string;
          added_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["site_admins"]["Row"]> & { email: string };
        Update: Partial<Database["public"]["Tables"]["site_admins"]["Row"]>;
      };
      page_views: {
        Row: {
          id: number;
          path: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["page_views"]["Row"]> & { path: string };
        Update: Partial<Database["public"]["Tables"]["page_views"]["Row"]>;
      };
    };
  };
}

/** Shape of a single task copied into a shared_bundles.payload array. */
export interface SharedTaskPayload {
  title: string;
  description: string | null;
  link_url: string | null;
  extra_links: string[];
  category: TaskCategory;
  emoji: string;
  recurrence_type: RecurrenceType;
  recurrence_days: number[] | null;
  custom_dates: string[] | null;
  priority: Priority;
}
