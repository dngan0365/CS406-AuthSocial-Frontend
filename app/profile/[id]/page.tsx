'use client';

import { useEffect, useState, useRef, useCallback, ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import { getProfile, updateProfile, uploadAvatar, getToken } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';
import type { Profile, Post } from '@/types';
import { Edit2, Loader, User, Camera } from 'lucide-react';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function ProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const observerTarget = useRef(null);

  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    loadProfile();
  }, [params.id]);

  // Intersection Observer để phát hiện khi scroll đến cuối
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loading, page]);

  const loadProfile = async () => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === params.id);
      
      const profileData = await getProfile(params.id as string);
      setProfile(profileData);
      setDisplayName(profileData.display_name || '');

      // Load posts với pagination
      await loadPosts(1);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (pageNum: number) => {
    try {
      const token = await getToken();
      const url = `${backendUrl}/posts?owner_id=${params.id}&page=${pageNum}&limit=${POSTS_PER_PAGE}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(url, { 
        headers,
        credentials: "include", 
      });
      
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      
      console.log(`Loaded ${data.length} posts for page ${pageNum}`);
      
      if (pageNum === 1) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }
      
      // Nếu số bài viết trả về ít hơn limit, nghĩa là đã hết
      if (data.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMorePosts = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage);
  }, [page, loadingMore, hasMore]);

  const handleUpdateProfile = async () => {
    try {
      await updateProfile(displayName);
      setProfile(prev => prev ? { ...prev, display_name: displayName } : null);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Có lỗi xảy ra khi cập nhật profile');
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);

    try {
      const res = await uploadAvatar(file);
      setProfile(prev => prev ? { ...prev, avatar_url: res.avatar_url } : prev);
    } catch (error) {
      console.error('Avatar upload failed', error);
      alert('Không thể tải avatar lên');
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Hàm mới: Cập nhật post locally mà KHÔNG reload
  const handlePostUpdate = useCallback((postId: string, likeCount: number, isLiked: boolean) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, like_count: likeCount, is_liked: isLiked }
          : post
      )
    );
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Không tìm thấy người dùng</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            {
              profile?.avatar_url ? (
                <img
                  src={avatarPreview || profile.avatar_url || '/default-avatar.png'}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
              ) : (
                <div className="w-full h-full rounded-full bg-blue-800 text-xl font-bold text-white flex items-center justify-center">
                  {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                </div>
              )
            }

            {isOwner && (
              <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition">
                <Camera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
              </label>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-full">
                <Loader size={20} className="animate-spin text-blue-600" />
              </div>
            )}
          </div>

          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tên hiển thị"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateProfile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setDisplayName(profile?.display_name || '');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    {profile.display_name || profile.username}
                  </h1>
                  {isOwner && (
                    <button
                      onClick={() => setEditing(true)}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                      title="Chỉnh sửa profile"
                    >
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                  )}
                </div>
                <p className="text-gray-600">@{profile.username}</p>
                <div className="flex gap-4 mt-4">
                  <div>
                    <span className="font-bold">{posts.length}</span>
                    <span className="text-gray-600 ml-1">bài viết</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div>
        <h2 className="text-xl font-bold mb-4">Bài viết</h2>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
              <User size={48} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có bài viết nào</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLikeChange={(postId, likeCount, isLiked) => 
                    handlePostUpdate(postId, likeCount, isLiked)
                  }
                />
              ))}
              
              {/* Điểm đánh dấu để Intersection Observer theo dõi */}
              <div ref={observerTarget} className="py-4">
                {loadingMore && (
                  <div className="flex justify-center">
                    <Loader size={32} className="animate-spin text-blue-600" />
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <div className="text-center text-gray-500 text-sm py-4">
                    Đã hiển thị tất cả bài viết
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}