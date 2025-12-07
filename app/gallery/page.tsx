/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPostsWithMedia } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Post, Media } from '@/types';
import { Loader, Image as ImageIcon, Heart, MessageCircle, X, Play } from 'lucide-react';

export default function GalleryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ media: Media; post: Post } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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

  const loadPosts = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const data = await getPostsWithMedia(pageNum, 50);
      
      if (pageNum === 1) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === 50);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage);
  };

  const openMediaModal = (media: Media, post: Post) => {
    setSelectedMedia({ media, post });
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
  };

  // Flatten all media from all posts for gallery display
  const allMedia: Array<{ media: Media; post: Post }> = [];
  posts.forEach(post => {
    if (post.media) {
      post.media.forEach(media => {
        allMedia.push({ media, post });
      });
    }
  });

  // Masonry columns - ĐÚNG VỊ TRÍ: sau khi allMedia đã có dữ liệu
  const COLUMNS = 4;
  const columns: Array<Array<{ media: Media; post: Post }>> = Array.from(
    { length: COLUMNS },
    () => []
  );

  allMedia.forEach((item, index) => {
    columns[index % COLUMNS].push(item);
  });

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thư viện ảnh & video</h1>
        <p className="text-gray-600">
          Khám phá {allMedia.length} media từ {posts.length} bài viết
        </p>
      </div>

      {/* Gallery Grid */}
      {allMedia.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <ImageIcon size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chưa có media nào
          </h3>
          <p className="text-gray-500 mb-6">
            Hãy đăng bài viết kèm ảnh hoặc video để chia sẻ với mọi người
          </p>
          {!user && (
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition font-semibold"
            >
              Đăng nhập ngay
            </button>
          )}
        </div>
      ) : (
        <>
          {/* MASONRY LAYOUT */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="grid gap-4">
                {column.map(({ media, post }, index) => (
                  <div
                    key={`${media.id}-${index}`}
                    className="relative cursor-pointer overflow-hidden rounded-lg group"
                    onClick={() => openMediaModal(media, post)}
                  >
                    {/* Media Display */}
                    {media.media_type === 'image' ? (
                      <img
                        src={media.url || getMediaUrl(media.storage_path)}
                        alt={post.content || 'Post media'}
                        className="block w-full h-auto rounded-lg transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="relative">
                        <video
                          src={media.url || getMediaUrl(media.storage_path)}
                          className="max-w-full h-auto rounded-lg"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                            <Play size={24} className="text-white ml-1" fill="white" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Badge */}
                    {media.is_ai && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded">
                        AI {media.ai_perc && `${media.ai_perc}%`}
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <Heart size={20} fill="white" />
                          <span className="font-semibold">{post.like_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader className="animate-spin" size={20} />
                    Đang tải...
                  </span>
                ) : (
                  'Tải thêm'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Media Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeMediaModal}
        >
          <button
            onClick={closeMediaModal}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition z-10"
          >
            <X size={24} />
          </button>

          <div
            className="max-w-5xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Media Display */}
              <div className="bg-black flex items-center justify-center p-4 md:p-8">
                {selectedMedia.media.media_type === 'image' ? (
                  <img
                    src={selectedMedia.media.url || getMediaUrl(selectedMedia.media.storage_path)}
                    alt="Selected media"
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                ) : (
                  <video
                    src={selectedMedia.media.url || getMediaUrl(selectedMedia.media.storage_path)}
                    controls
                    className="max-w-full max-h-[70vh] rounded-lg"
                  />
                )}
              </div>

              {/* Post Details */}
              <div className="p-6 flex flex-col">
                {/* Author */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                    {selectedMedia.post.owner_avatar ? (
                      <img
                        src={selectedMedia.post.owner_avatar}
                        alt={selectedMedia.post.owner_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedMedia.post.owner_name?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">
                      {selectedMedia.post.owner_name || 'Người dùng'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedMedia.post.created_at).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* AI Detection Badge */}
                {selectedMedia.media.is_ai && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-700">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        AI
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Nội dung được tạo bởi AI</p>
                        {selectedMedia.media.ai_perc && (
                          <p className="text-xs">Độ tin cậy: {selectedMedia.media.ai_perc}%</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  {selectedMedia.post.content && (
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">
                      {selectedMedia.post.content}
                    </p>
                  )}
                  
                  {/* Media Count */}
                  {selectedMedia.post.media && selectedMedia.post.media.length > 1 && (
                    <p className="text-sm text-gray-500 mb-4">
                      {selectedMedia.post.media.length} media trong bài viết này
                    </p>
                  )}
                </div>

                {/* Stats & Actions */}
                <div className="pt-4 border-t mt-4">
                  <div className="flex items-center gap-6 text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Heart size={20} className={selectedMedia.post.is_liked ? 'fill-red-500 text-red-500' : ''} />
                      <span className="font-semibold">{selectedMedia.post.like_count || 0}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      closeMediaModal();
                      router.push(`/post/${selectedMedia.post.id}`);
                    }}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
                  >
                    Xem chi tiết bài viết
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Helper function to get media URL
function getMediaUrl(storagePath: string): string {
  // Fallback if URL is not provided
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_STORAGE_BUCKET}/${storagePath}`;
}