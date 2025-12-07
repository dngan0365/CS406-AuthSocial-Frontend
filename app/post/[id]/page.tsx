'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPost } from '@/lib/api';
import PostCardDetail from '@/components/PostCardDetail';
import type { Post } from '@/types';
import { ArrowLeft, Loader, AlertTriangle } from 'lucide-react';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [params.id]);

  const loadPost = async () => {
    try {
      const postData = await getPost(params.id as string);
      setPost(postData);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPost(updatedPost);
  };

  const handlePostDeleted = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <Loader size={48} className="animate-spin text-blue-600" />
        <p className="text-gray-600 font-medium">Đang tải bài viết...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <AlertTriangle size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Không tìm thấy bài viết
          </h2>
          <p className="text-gray-500 mb-8">
            Bài viết này có thể đã bị xóa hoặc không tồn tại
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold shadow-sm hover:shadow-md inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Quay lại</span>
        </button>
      </div>

      {/* Post Content */}
      <PostCardDetail 
        post={post} 
        onLikeChange={loadPost}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
        isDetailView={true}
      />
    </div>
  );
}