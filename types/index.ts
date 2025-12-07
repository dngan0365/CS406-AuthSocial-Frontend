export type MediaType = 'image' | 'video';

export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

export interface Post {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_avatar?: string;
  content?: string;
  ai_perc?: number;
  is_private: boolean;
  status: "pending" | "approved" | "rejected" | "error";
  like_count: number;
  created_at: string;
  media?: Media[];
  is_liked?: boolean;
}

export interface Media {
  id: string;
  post_id: string;
  storage_path: string;
  url?: string;
  media_type: MediaType;
  order: number;
  ai_perc?: number;
  is_ai?: boolean;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  profiles?: Profile;
}

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id?: string;
  post_id?: string;
  type: string;
  body?: string;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Post;
}