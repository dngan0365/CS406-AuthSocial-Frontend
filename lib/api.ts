/* eslint-disable @typescript-eslint/no-explicit-any */

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL!;
import { Post } from '@/types';
import { supabase } from './supabase';



async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

/* --------------------- POSTS --------------------- */

export interface MediaResponse {
  id: string;
  storage_path: string;
  media_type: string;
  order: number;
  url?: string;
  ai_perc?: number;  // Confidence score from AI detection
  is_ai?: boolean;   // True if image is AI-generated
}

export interface PostResponse {
  id: string;
  owner_id: string;
  owner_name?: string;
  owner_avatar?: string;
  content?: string;
  is_private: boolean;
  like_count: number;
  created_at: string;
  status?: string;  // "pending" | "approved" | "rejected" | "error"
  ai_perc?: number; // Percentage of AI images in post
  media: MediaResponse[];
  is_liked: boolean;
}

export const getPosts = async (ownerId?: string) => {
  const token = await getToken() || NaN;
  // console.log("Fetching posts from API, ownerId:", ownerId);
  const url = ownerId
    ? `${backendUrl}/posts?owner_id=${ownerId}`
    : `${backendUrl}/posts`;

  const res = await fetch(url, 
    { 
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`},
      credentials: "include", 
    }
  );
  // console.log("Get Posts response:", res);
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
};

export const getPost = async (id: string) => {
  const token = await getToken() || NaN;
  const res = await fetch(`${backendUrl}/posts/${id}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`},
    credentials: "include",
  });
  if (!res.ok) throw new Error("Post not found");
  // console.log("Get Posts response:", await res.json());
  return res.json();
};

export const createPost = async (content: string, isPrivate = false) => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`},
    credentials: "include",
    body: JSON.stringify({ content, is_private: isPrivate }),
  });

  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
};

export const updatePost = async (id: string, content: string, isPrivate: boolean) => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/posts/${id}`, {
    method: "PATCH", // Changed from PUT to PATCH to match backend
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}`
    },
    credentials: "include",
    body: JSON.stringify({ content, is_private: isPrivate }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to update post" }));
    throw new Error(error.detail || "Failed to update post");
  }
  
  return res.json();
};
export const deletePost = async (id: string) => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to delete post");
};


/* --------------------- MEDIA --------------------- */

export const uploadMedia = async (postId: string, file: File, order = 0) => {
  const formData = new FormData();
  formData.append("file", file);
  const token = await getToken();

  const res = await fetch(`${backendUrl}/posts/${postId}/media`, {
    method: "POST",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Media upload failed");
  const data = await res.json();

  // `data.url` sẽ có public URL để hiển thị ngay
  return data; // { id, post_id, storage_path, media_type, order, url }
};

export const deleteMedia = async (id: string, storagePath: string) => {
  const res = await fetch(`${backendUrl}/media/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storage_path: storagePath }),
  });

  if (!res.ok) throw new Error("Failed to delete media");
};

export const getMediaUrl = (path: string) => {
  return `${mediaUrl}/${path}`;
};

export const uploadMediaToStorage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const token = await getToken();

  const res = await fetch(`${backendUrl}/media/upload-temp`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) throw new Error('Failed to upload media');
  return res.json(); // { id, url, storage_path, media_type }
};

export const linkMediaToPost = async (
  postId: string,
  storagePath: string,
  mediaType: string,
  order: number
) => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/posts/${postId}/media/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      storage_path: storagePath,
      media_type: mediaType,
      order: order,
    }),
  });

  if (!res.ok) throw new Error('Failed to link media to post');
  return res.json();
};
/* --------------------- AI STATUS --------------------- */

export interface AIStatusResponse {
  post_id: string;
  status?: string;  // "pending" | "approved" | "rejected" | "error"
  ai_perc?: number;
  media: MediaResponse[];
}

export const getAIStatus = async (postId: string): Promise<AIStatusResponse> => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/posts/${postId}/ai_status`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  console.log("AI Status response:", res);

  if (!res.ok) throw new Error("Failed to fetch AI status");
  return res.json();
};

/* --------------------- LIKES --------------------- */

export const likePost = async (postId: string) => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/posts/${postId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to like post");
};

export const unlikePost = async (postId: string) => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/posts/${postId}/like`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to unlike post");
};

export const checkIfLiked = async (postId: string) => {
  const token = await getToken();
  if (!token) return false;
  const res = await fetch(`${backendUrl}/posts/${postId}/liked`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return false;
  return (await res.json()).liked;
};


/* --------------------- PROFILES --------------------- */
// getProfile — lấy profile theo user_id
export const getProfile = async (id: string) => {
  const token = await getToken();

  const res = await fetch(`${backendUrl}/profiles/${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Profile not found");
  return res.json();
};


// getMyProfile — lấy profile của user hiện tại (/me)
export const getMyProfile = async () => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/profiles/me`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Profile not found");
  return res.json();
};

// Upload avatar (POST /profiles/me/avatar)
export const updateProfile = async (displayName: string, avatarUrl?: string) => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/profiles/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    credentials: "include",
    body: JSON.stringify({
      display_name: displayName,
      avatar_url: avatarUrl,
    }),
  });

  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
};

// uploadAvatar — tải lên avatar cho user hiện tại (/me/avatar)
export const uploadAvatar = async (file: File) => {
  const token = await getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${backendUrl}/profiles/me/avatar`, {
    method: "POST",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload avatar");
  return res.json();
};



/* --------------------- NOTIFICATIONS --------------------- */

export const getNotifications = async (page = 1, limit = 20, unreadOnly = false) => {
  const token = await getToken();
  const url = `${backendUrl}/notifications?page=${page}&limit=${limit}&unread_only=${unreadOnly}`;

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
};

export const markNotificationAsRead = async (id: string) => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to mark notification as read");
  return res.json();
};

export const markAllNotificationsAsRead = async () => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/notifications/mark-all-read`, {
    method: "POST",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to mark all as read");
  return res.json();
};

export const getUnreadCount = async () => {
  const token = await getToken();
  const res = await fetch(`${backendUrl}/notifications/unread-count`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to get unread count");
  return res.json();
};

/**
 * Get all posts with media (for gallery view)
 */
export async function getPostsWithMedia(page: number = 1, limit: number = 50): Promise<Post[]> {
  const response = await fetch(
    `${backendUrl}/posts?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  const posts = await response.json();
  
  // Filter posts that have media
  return posts.filter((post: Post) => post.media && post.media.length > 0);
}