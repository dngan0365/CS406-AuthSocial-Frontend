'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import { getProfile, getPosts, updateProfile, uploadAvatar } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';
import type { Profile, Post } from '@/types';
import { Edit2, Loader, User, Camera } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [params.id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === params.id);
      const viewingOwnProfile = user?.id === params.id;
      
      console.log('🔍 PROFILE PAGE DEBUG:');
      console.log('  Current user:', user?.id);
      console.log('  Profile ID:', params.id);
      console.log('  Is own profile:', viewingOwnProfile);
      
      const profileData = await getProfile(params.id as string);
      setProfile(profileData);
      setDisplayName(profileData.display_name || '');

      const postsData = await getPosts(params.id as string);
      console.log('📊 POSTS RECEIVED:', postsData.length);
      console.log('  Sample posts:');
      postsData.slice(0, 3).forEach((p: Post) => {
        console.log(`    - ${p.id.substring(0, 8)}: status=${p.status}, private=${p.is_private}`);
      });
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
            <img
              src={avatarPreview || profile.avatar_url || '/default-avatar.png'}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover"
            />
            {isOwner && (
              <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full cursor-pointer border">
                <Camera size={16} className="text-gray-600" />
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
                    onClick={() => setEditing(false)}
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
              Chưa có bài viết nào
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onLikeChange={loadProfile} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
