'use client';

import { useState } from 'react';
import { Image, Video, Lock, Unlock, Loader, X, Smile } from 'lucide-react';
import { uploadMediaToStorage, createPost, linkMediaToPost } from '@/lib/api';

interface UploadedMedia {
  id: string;
  url: string;
  storage_path: string;
  media_type: string;
  file: File;
}

interface PostFormProps {
  onPostCreated?: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    setError('');
    const files = Array.from(e.target.files);

    // Validate file count
    if (uploadedMedia.length + files.length > 10) {
      setError('Bạn chỉ có thể tải lên tối đa 4 ảnh/video');
      setUploading(false);
      e.target.value = '';
      return;
    }

    try {
      for (const file of files) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          setError(`File "${file.name}" quá lớn. Vui lòng chọn file nhỏ hơn 10MB`);
          continue;
        }

        const mediaData = await uploadMediaToStorage(file);
        setUploadedMedia(prev => [...prev, { ...mediaData, file }]);
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      setError('Có lỗi xảy ra khi tải lên media. Vui lòng thử lại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && uploadedMedia.length === 0) {
      setError('Vui lòng nhập nội dung hoặc thêm ảnh/video');
      return;
    }

    setPosting(true);
    setError('');
    
    try {
      const post = await createPost(content, isPrivate);

      for (let i = 0; i < uploadedMedia.length; i++) {
        const media = uploadedMedia[i];
        await linkMediaToPost(post.id, media.storage_path, media.media_type, i);
      }

      setContent('');
      setUploadedMedia([]);
      setIsPrivate(false);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
      successDiv.textContent = '✓ Đăng bài thành công!';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
      
      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại');
    } finally {
      setPosting(false);
    }
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const charCount = content.length;
  const maxChars = 5000;

  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bạn đang nghĩ gì? 💭"
          className="w-full p-2 border-0 rounded-sm resize-none focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-400"
          rows={1}
          disabled={posting}
          maxLength={maxChars}
        />

        {/* Character counter */}
        {content.length > 0 && (
          <div className={`text-right text-sm mt-1 ${charCount > maxChars * 0.9 ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
            {charCount}/{maxChars}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <span className="text-red-500 font-semibold">⚠️</span>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Media preview grid */}
        {uploadedMedia.length > 0 && (
          <div className={`mt-2 grid gap-3 ${
            uploadedMedia.length === 1 ? 'grid-cols-2' :
            uploadedMedia.length === 2 ? 'grid-cols-2' :
            uploadedMedia.length === 3 ? 'grid-cols-3' :
            'grid-cols-4'
          }`}>
            {uploadedMedia.map((media, idx) => (
              <div key={idx} className="relative group">
                <div className={`rounded-sm overflow-hidden border-2 border-gray-200 ${
                  uploadedMedia.length === 1 ? 'aspect-video' : 'aspect-square'
                }`}>
                  {media.media_type === 'video' ? (
                    <div className="w-full h-full relative bg-blue-800">
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                        <Video size={20} className="text-white opacity-80" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={media.url}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <button
                  onClick={() => removeMedia(idx)}
                  disabled={posting}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110 transform"
                  title="Xóa"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload progress indicator */}
        {uploading && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-sm">
            <div className="flex items-center gap-3">
              <Loader size={10} className="animate-spin text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Đang tải lên...</p>
                <p className="text-xs text-blue-700">Vui lòng đợi trong giây lát</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-2 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <label className={`cursor-pointer p-2.5 hover:bg-gray-200 rounded-lg transition flex items-center gap-2 ${
            uploading || posting || uploadedMedia.length >= 4 ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <Image size={22} className="text-green-600" />
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">Ảnh/Video</span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading || posting || uploadedMedia.length >= 4}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setIsPrivate(!isPrivate)}
            disabled={posting}
            className={`p-2.5 hover:bg-gray-200 rounded-lg transition flex items-center gap-2 ${
              isPrivate ? 'bg-yellow-100' : ''
            }`}
            title={isPrivate ? 'Riêng tư' : 'Công khai'}
          >
            {isPrivate ? (
              <>
                <Lock size={22} className="text-yellow-600" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">Riêng tư</span>
              </>
            ) : (
              <>
                <Unlock size={22} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">Công khai</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={posting || uploading || (!content.trim() && uploadedMedia.length === 0)}
          className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2 font-semibold shadow-sm hover:shadow-md"
        >
          {posting ? (
            <>
              <Loader size={18} className="animate-spin" />
              <span>Đang đăng...</span>
            </>
          ) : (
            <>
              <Smile size={18} />
              <span>Đăng bài</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}