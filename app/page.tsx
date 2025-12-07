/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPosts } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import PostForm from '@/components/PostForm';
import PostCard from '@/components/PostCard';
import type { Post } from '@/types';
import { Loader } from 'lucide-react';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadPosts();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadPosts = async () => {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <PostForm onPostCreated={loadPosts} />
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
          posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeChange={loadPosts} />
          ))
        )}
      </div>
    </div>
  );
}
