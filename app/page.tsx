/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getToken } from '@/lib/api';
import PostForm from '@/components/PostForm';
import PostCard from '@/components/PostCard';
import type { Post } from '@/types';
import { Loader } from 'lucide-react';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const observerTarget = useRef(null);

  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    checkAuth();
    loadPosts(1);
  }, []);

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

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadPosts = async (pageNum: number) => {
    try {
      const token = await getToken();
      const url = `${backendUrl}/posts?page=${pageNum}&limit=${POSTS_PER_PAGE}`;

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
      setLoading(false);
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

  // Hàm này chỉ dùng khi TẠO POST MỚI
  const handlePostCreated = () => {
    // Reset và tải lại từ đầu
    setPage(1);
    setHasMore(true);
    setLoading(true);
    loadPosts(1);
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {user && (
        <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Tạo bài viết mới
          </h2>
          <PostForm onPostCreated={handlePostCreated} />
        </div>
      )}

      {!user && (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-gray-200">
          <h2 className="text-2xl font-extrabold mb-2 text-gray-800">
            Chào mừng đến với SocialApp! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Đăng nhập để chia sẻ và kết nối với mọi người
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition font-semibold"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-2xl shadow">
            Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!
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
  );
}