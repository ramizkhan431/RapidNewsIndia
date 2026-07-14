export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: Role;
  reporter_profile?: {
    is_approved: boolean;
  };
}

export interface Reporter {
  id: number;
  user_id: number;
  district: string;
  state: string;
  bio?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  level: 'national' | 'state' | 'district';
  parent_id?: number;
  children?: Category[];
}

export interface Media {
  id: number;
  media_type: 'image' | 'youtube';
  url: string;
  title?: string;
  news_id?: number;
  submission_id?: number;
  created_at: string;
}

export interface News {
  id: number;
  title: string;
  slug: string;
  content: string;
  language: 'en' | 'hi' | 'bn';
  status: 'draft' | 'published' | 'scheduled';
  published_at?: string;
  view_count: number;
  author_id: number;
  category_id: number;
  created_at: string;
  updated_at: string;
  author?: User;
  category?: Category;
  media_items?: Media[];
}

export interface Submission {
  id: number;
  submission_type: 'tip' | 'complaint' | 'opinion';
  title: string;
  content: string;
  reporter_name?: string;
  reporter_email: string;
  district?: string;
  status: 'pending' | 'approved' | 'rejected';
  moderated_by?: number;
  moderation_notes?: string;
  created_at: string;
  updated_at: string;
  media_items?: Media[];
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  users_count: number;
  reporters_count: number;
  news_count: number;
  submissions_count: number;
  views_count: number;
}
