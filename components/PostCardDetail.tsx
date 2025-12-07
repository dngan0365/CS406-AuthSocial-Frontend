/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { likePost, unlikePost, checkIfLiked, getMediaUrl, deletePost, updatePost } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Heart, Lock, Unlock, MessageCircle, Share2, MoreHorizontal, Edit3, Trash2, X, Loader, AlertTriangle, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { Post } from '@/types';

interface PostCardDetailProps {
  post: Post;
  onLikeChange?: () => void;
  onPostDeleted?: () => void;
  onPostUpdated?: (updatedPost: Post) => void;
  isDetailView?: boolean;
}

export default function PostCardDetail({ post, onLikeChange, onPostDeleted, onPostUpdated, isDetailView = false }: PostCardDetailProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Current post state
  const [currentPost, setCurrentPost] = useState<Post>(post);
  
  // Owner check
  const [isOwner, setIsOwner] = useState(false);
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(currentPost.content || '');
  const [editIsPrivate, setEditIsPrivate] = useState(currentPost.is_private);
  const [updating, setUpdating] = useState(false);
  
  // Delete states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Menu state
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (post.is_liked === true) {
      setIsLiked(post.is_liked);
    } else {
      checkIfLiked(post.id).then(setIsLiked);
    }
    
    // Check if current user is owner
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsOwner(user?.id === post.owner_id);
    });

    // Update current post when prop changes
    setCurrentPost(post);
    setEditContent(post.content || '');
    setEditIsPrivate(post.is_private);
  }, [post]);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (isLiked) {
        await unlikePost(post.id);
        setLikeCount(prev => Math.max(prev - 1, 0));
        setIsLiked(false);
      } else {
        await likePost(post.id);
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
      }
      onLikeChange?.();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => {
    setEditContent(currentPost.content || '');
    setEditIsPrivate(currentPost.is_private);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setEditContent(currentPost.content || '');
    setEditIsPrivate(currentPost.is_private);
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) {
      showNotification('⚠️ Nội dung không được để trống', 'error');
      return;
    }

    setUpdating(true);
    try {
      await updatePost(post.id, editContent, editIsPrivate);
      
      // Update local state
      const updatedPost = {
        ...currentPost,
        content: editContent,
        is_private: editIsPrivate,
      };
      setCurrentPost(updatedPost);
      
      showNotification('✓ Đã cập nhật bài viết', 'success');
      setIsEditing(false);
      onPostUpdated?.(updatedPost);
    } catch (error: any) {
      console.error('Error updating post:', error);
      showNotification(error.message || '✗ Có lỗi xảy ra khi cập nhật', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(post.id);
      showNotification('✓ Đã xóa bài viết', 'success');
      
      setTimeout(() => {
        onPostDeleted?.();
        router.push('/');
      }, 1500);
    } catch (error) {
      console.error('Error deleting post:', error);
      showNotification('✗ Có lỗi xảy ra khi xóa bài viết', 'error');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    const div = document.createElement('div');
    div.className = `fixed top-20 left-1/2 transform -translate-x-1/2 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${currentPost.owner_id}`} className="flex-shrink-0">
            {currentPost.owner_avatar ? (
              <img 
                src={currentPost.owner_avatar} 
                alt={currentPost.owner_name || 'User'} 
                className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 hover:ring-blue-400 transition"
              />
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {currentPost.owner_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/profile/${currentPost.owner_id}`}>
              <p className="font-semibold text-gray-900 hover:text-blue-600 transition truncate">
                {currentPost.owner_name}
              </p>
            </Link>
            <p className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
              <span>{mounted ? formatDate(currentPost.created_at) : currentPost.created_at}</span>
              {currentPost.is_private && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                  <Lock size={10} />
                  Riêng tư
                </span>
              )}
              {currentPost.ai_perc !== undefined && currentPost.ai_perc > 0 && (
                <span 
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    currentPost.ai_perc >= 70 
                      ? 'bg-purple-100 text-purple-700' 
                      : currentPost.ai_perc >= 40
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  title={`${currentPost.ai_perc}% ảnh có khả năng được tạo bởi AI`}
                >
                  <Sparkles size={10} />
                  {currentPost.ai_perc}% AI
                </span>
              )}
            </p>
          </div>
        </div>

        {isOwner && !isEditing && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition" 
              title="Tùy chọn"
            >
              <MoreHorizontal size={20} className="text-gray-500" />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={handleStartEdit}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <Edit3 size={16} />
                    <span>Chỉnh sửa bài viết</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                  >
                    <Trash2 size={16} />
                    <span>Xóa bài viết</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        
        {!isOwner && (
          <button className="p-2 hover:bg-gray-100 rounded-full transition" title="Thêm">
            <MoreHorizontal size={20} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* EDIT MODE */}
      {isEditing ? (
        <div className="border-t border-gray-200">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <Edit3 size={18} />
              Chỉnh sửa bài viết
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Cập nhật nội dung và quyền riêng tư của bài viết
            </p>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Text Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung bài viết
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                rows={6}
                disabled={updating}
                maxLength={5000}
                placeholder="Nhập nội dung bài viết..."
              />
              
              {editContent.length > 0 && (
                <div className={`text-right text-sm mt-2 ${editContent.length > 4500 ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
                  {editContent.length}/5000
                </div>
              )}
            </div>

            {/* Current Media Preview */}
            {currentPost.media && currentPost.media.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <ImageIcon size={16} />
                  <span>Media hiện tại ({currentPost.media.length})</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    Không thể chỉnh sửa media
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {currentPost.media.slice(0, 4).map((media) => {
                    const url = getMediaUrl(media.storage_path);
                    const hasAIDetection = media.ai_perc !== undefined && media.ai_perc > 0;
                    const isHighAI = media.ai_perc !== undefined && media.ai_perc >= 70;
                    
                    return (
                      <div
                        key={media.id}
                        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
                      >
                        {media.media_type === 'video' ? (
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={url}
                            alt="Post media"
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* AI Detection Badge */}
                        {hasAIDetection && (
                          <div className="absolute top-2 right-2 z-10">
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
                              <Sparkles size={12} />
                              <span>{media.ai_perc}%</span>
                            </div>
                          </div>
                        )}
                        
                        {media.is_ai && (
                          <div className="absolute top-2 left-2 z-10">
                            <div className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-xs font-bold shadow-lg flex items-center gap-1">
                              <Sparkles size={12} />
                              AI
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {currentPost.media.length > 4 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    +{currentPost.media.length - 4} media khác
                  </p>
                )}
              </div>
            )}

            {/* Privacy Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quyền riêng tư
              </label>
              <button
                onClick={() => setEditIsPrivate(!editIsPrivate)}
                disabled={updating}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium w-full border-2 ${
                  editIsPrivate 
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100' 
                    : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                }`}
              >
                {editIsPrivate ? (
                  <>
                    <Lock size={20} />
                    <div className="text-left flex-1">
                      <div className="font-semibold">Riêng tư</div>
                      <div className="text-xs opacity-80">Chỉ bạn có thể xem</div>
                    </div>
                  </>
                ) : (
                  <>
                    <Unlock size={20} />
                    <div className="text-left flex-1">
                      <div className="font-semibold">Công khai</div>
                      <div className="text-xs opacity-80">Mọi người có thể xem</div>
                    </div>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              onClick={handleCancelEdit}
              disabled={updating}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              <X size={18} />
              Hủy
            </button>
            <button
              onClick={handleUpdate}
              disabled={updating || !editContent.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 flex items-center gap-2"
            >
              {updating ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Edit3 size={18} />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* CONTENT */}
          {currentPost.content && (
            <div className="px-4 pb-3">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                {currentPost.content}
              </p>
            </div>
          )}

          {/* MEDIA */}
          {currentPost.media && currentPost.media.length > 0 && (
            <div className={`${currentPost.content ? 'mt-2' : ''} space-y-1`}>
              {currentPost.media.map((media) => {
                const url = getMediaUrl(media.storage_path);
                const hasAIDetection = media.ai_perc !== undefined && media.ai_perc > 0;
                const isHighAI = media.ai_perc !== undefined && media.ai_perc >= 70;

                return (
                  <div
                    key={media.id}
                    className="relative bg-gray-100 overflow-hidden w-full group"
                  >
                    {media.media_type === 'video' ? (
                      <video
                        src={url}
                        className="w-full h-auto max-h-[600px] object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={url}
                        alt="Post media"
                        className="w-full h-auto max-h-[800px] object-contain"
                      />
                    )}
                    
                    {/* AI Detection Badge for Images */}
                    {media.media_type === 'image' && hasAIDetection && (
                      <div className="absolute top-4 right-4 z-10">
                        <div 
                          className={`px-3 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 font-semibold shadow-2xl transition-all ${
                            isHighAI
                              ? 'bg-purple-500/95 text-white'
                              : media.ai_perc! >= 40
                              ? 'bg-blue-500/95 text-white'
                              : 'bg-gray-800/95 text-white'
                          }`}
                          title={`${media.ai_perc}% khả năng được tạo bởi AI`}
                        >
                          <Sparkles size={16} />
                          <span className="text-sm">{media.ai_perc}% AI</span>
                        </div>
                      </div>
                    )}
                    
                    {/* AI Generated Badge */}
                    {media.is_ai && (
                      <div className="absolute top-4 left-4 z-10">
                        <div className="px-3 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-xl text-white font-bold shadow-2xl flex items-center gap-2 animate-pulse">
                          <Sparkles size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
                          <span className="text-sm">AI Generated</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STATS */}
          {likeCount > 0 && (
            <div className="px-4 py-3 border-b border-gray-100">
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
          <div className="flex items-center justify-around px-4 py-3 border-t border-gray-100">
            <button
              onClick={handleLike}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                mounted && isLiked 
                  ? 'text-red-500 hover:bg-red-50' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart
                size={20}
                className={mounted && isLiked ? 'fill-red-500' : ''}
              />
              <span className="font-medium text-sm">Thích</span>
            </button>

            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-600">
              <MessageCircle size={20} />
              <span className="font-medium text-sm">Bình luận</span>
            </button>

            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-600">
              <Share2 size={20} />
              <span className="font-medium text-sm">Chia sẻ</span>
            </button>
          </div>
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Xóa bài viết?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Xóa bài viết
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}