/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { likePost, unlikePost, checkIfLiked, getMediaUrl } from '@/lib/api';
import { Heart, Lock, MessageCircle, Share2, MoreHorizontal, Sparkles } from 'lucide-react';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onLikeChange?: (postId: string, likeCount: number, isLiked: boolean) => void;
}

export default function PostCard({ post, onLikeChange }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  useEffect(() => {
    if (post.is_liked === true){
      setIsLiked(post.is_liked);
      return;
    }
    checkIfLiked(post.id).then(setIsLiked);
  }, [post.id, post.is_liked]);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked 
        ? likeCount + 1 
        : Math.max(likeCount - 1, 0);

      // Optimistic update - cập nhật UI ngay lập tức
      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);

      // Gọi API
      if (isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }

      // Thông báo parent component để update state
      onLikeChange?.(post.id, newLikeCount, newIsLiked);
      
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Rollback nếu có lỗi
      setIsLiked(!isLiked);
      setLikeCount(likeCount);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const contentPreview = post.content && post.content.length > 300 
    ? post.content.substring(0, 300) + '...' 
    : post.content;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.owner_id}`} className="flex-shrink-0">
            {post.owner_avatar ? (
              <img 
                src={post.owner_avatar} 
                alt={post.owner_name || 'User'} 
                className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 hover:ring-blue-400 transition"
              />
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {post.owner_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/profile/${post.owner_id}`}>
              <p className="font-semibold text-gray-900 hover:text-blue-600 transition truncate">
                {post.owner_name}
              </p>
            </Link>
            <p className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
              <span>{mounted ? formatDate(post.created_at) : post.created_at}</span>
              {post.is_private && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                  <Lock size={10} />
                  Riêng tư
                </span>
              )}
              {post.ai_perc !== undefined && post.ai_perc > 0 && (
                <span 
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    post.ai_perc >= 70 
                      ? 'bg-purple-100 text-purple-700' 
                      : post.ai_perc >= 40
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  title={`${post.ai_perc}% ảnh có khả năng được tạo bởi AI`}
                >
                  <Sparkles size={10} />
                  {post.ai_perc}% AI
                </span>
              )}
            </p>
          </div>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-full transition" title="Thêm">
          <MoreHorizontal size={20} className="text-gray-500" />
        </button>
      </div>

      {/* CONTENT */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {showFullContent || !contentPreview ? post.content : contentPreview}
          </p>
          {post.content.length > 300 && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {showFullContent ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}

      {/* MEDIA */}
      {post.media && post.media.length > 0 && (
        <div className={`${post.content ? 'mt-2' : ''}`}>
          <div className={`grid ${
            post.media.length === 1 ? 'grid-cols-1' :
            post.media.length === 2 ? 'grid-cols-2' :
            post.media.length === 3 ? 'grid-cols-3' :
            'grid-cols-2'
          } gap-0.5 bg-gray-200`}>
            {post.media.slice(0, 4).map((media, index) => {
              const url = getMediaUrl(media.storage_path);
              const hasMore = post.media && post.media.length > 4 && index === 3;
              const hasAIDetection = media.ai_perc !== undefined && media.ai_perc > 0;
              const isHighAI = media.ai_perc !== undefined && media.ai_perc >= 70;

              return (
                <Link
                  key={media.id}
                  href={`/post/${post.id}`}
                  className={`relative bg-gray-100 overflow-hidden group ${
                    post.media?.length === 1 ? 'aspect-video' : 'aspect-square'
                  } ${hasMore ? 'cursor-pointer' : ''}`}
                >
                  {media.media_type === 'video' ? (
                    <video
                      src={url}
                      className="w-full h-full object-cover hover:opacity-95 transition"
                      muted
                    />
                  ) : (
                    <img
                      src={url}
                      alt="Post media"
                      className="w-full h-full object-cover hover:opacity-95 transition"
                    />
                  )}
                  
                  {/* AI Detection Badge */}
                  {media.media_type === 'image' && hasAIDetection && !hasMore && (
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div 
                        className={`px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1 text-xs font-semibold shadow-lg ${
                          isHighAI
                            ? 'bg-purple-500/90 text-white'
                            : media.ai_perc! >= 40
                            ? 'bg-blue-500/90 text-white'
                            : 'bg-gray-700/90 text-white'
                        }`}
                        title={`${media.ai_perc}% khả năng được tạo bởi AI`}
                      >
                        <Sparkles size={10} />
                        <span>{media.ai_perc}%</span>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Generated Badge */}
                  {media.is_ai && !hasMore && (
                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-xs font-bold shadow-lg flex items-center gap-1">
                        <Sparkles size={10} />
                        AI
                      </div>
                    </div>
                  )}
                  
                  {hasMore && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">
                        +{(post.media?.length || 0) - 4}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* STATS */}
      {likeCount > 0 && (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                <Heart size={12} className="fill-white text-white" />
              </div>
            </div>
            <span className="font-medium">
              {likeCount === 1 ? '1 người' : `${likeCount} người`} đã thích
            </span>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex items-center justify-around px-4 py-2 border-t border-gray-100">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
            mounted && isLiked 
              ? 'text-red-500 hover:bg-red-50' 
              : 'text-gray-600 hover:bg-gray-100'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Heart
            size={20}
            className={`transition-all ${mounted && isLiked ? 'fill-red-500 scale-110' : ''}`}
          />
          <span className="font-medium text-sm">Thích</span>
        </button>

        <Link
          href={`/post/${post.id}`}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
        >
          <MessageCircle size={20} />
          <span className="font-medium text-sm">Bình luận</span>
        </Link>

        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-600">
          <Share2 size={20} />
          <span className="font-medium text-sm">Chia sẻ</span>
        </button>
      </div>
    </div>
  );
}