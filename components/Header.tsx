/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, signOut } from '@/lib/supabase';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount, getProfile, getMediaUrl } from '@/lib/api';
import { Bell, LogOut, User, Menu, Heart, MessageCircle, X, LayoutGrid, List } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Notification } from '@/types';

export default function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadNotifications();
        loadProfile(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadNotifications();
          loadProfile(session.user.id);
        } else {
          setProfileData(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const data = await getProfile(userId);
      setProfileData(data);
      
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications(1, 10);
      setNotifications(data);
      
      const countData = await getUnreadCount();
      setUnreadCount(countData.count || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setProfileData(null);
    router.push('/login');
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifOpen(false);
      
      if (notification.post_id) {
        router.push(`/post/${notification.post_id}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={16} className="text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'follow':
        return <User size={16} className="text-green-500" />;
      default:
        return null;
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
    if (minutes < 60) return `${minutes}p`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  };

  // Helper function to get display info for notification
  const getNotificationDisplayInfo = (notification: Notification) => {
    if (notification.actor) {
      return {
        avatarUrl: notification.actor.avatar_url,
        displayName: notification.actor.display_name || notification.actor.username,
        initial: notification.actor.username?.[0]?.toUpperCase() || 'U'
      };
    }
    // If actor is null, use current user's info
    return {
      avatarUrl: profileData?.avatar_url,
      displayName: profileData?.display_name || profileData?.username || user?.email?.split('@')[0],
      initial: user?.email?.[0]?.toUpperCase() || 'U'
    };
  };

  const isGalleryView = pathname === '/gallery';

  return (
    <header className="bg-white/90 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/cslogo.png"
            alt="SocialApp Logo"
            width={40}
            height={40}
          />
          <Link href="/" className="text-2xl font-bold bg-clip-text text-blue-800 tracking-tight hover:opacity-80 transition">
            AuthSocial
          </Link>
        </div>

        {/* View Mode Toggle - Desktop */}
        <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <Link
            href="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
              !isGalleryView
                ? 'bg-white shadow-sm text-blue-600 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List size={18} />
            <span className="text-sm">Bài viết</span>
          </Link>
          <Link
            href="/gallery"
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
              isGalleryView
                ? 'bg-white shadow-sm text-blue-600 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid size={18} />
            <span className="text-sm">Thư viện</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {/* Notification Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setMenuOpen(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition relative"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-lg overflow-hidden animate-fadeIn">
                    <div className="px-4 py-2 bg-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-lg">Thông báo</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                      {loading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Bell size={44} className="mx-auto mb-3 opacity-30" />
                          <p>Chưa có thông báo nào</p>
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          const displayInfo = getNotificationDisplayInfo(notification);
                          
                          return (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full text-left p-2 hover:bg-gray-50 transition ${
                                !notification.is_read ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {displayInfo.avatarUrl ? (
                                    <img
                                      src={displayInfo.avatarUrl}
                                      alt="Avatar"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-blue-800 flex items-center justify-center text-white font-bold text-sm">
                                      {displayInfo.initial}
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    {getIcon(notification.type)}
                                    <p className="font-semibold text-sm truncate">
                                      {displayInfo.displayName}
                                    </p>
                                    <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                                      {formatDate(notification.created_at)}
                                    </span>
                                  </div>
                                  
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {notification.body || `đã ${notification.type === 'like' ? 'thích' : notification.type === 'comment' ? 'bình luận' : 'theo dõi'} bài viết của bạn`}
                                  </p>
                                </div>

                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-800 rounded-full flex-shrink-0 mt-1"></div>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="px-4 py-3 bg-gray-100">
                        <button
                          onClick={() => {
                            setNotifOpen(false);
                            router.push('/notifications');
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center"
                        >
                          Xem tất cả thông báo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Menu Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => {
                    setMenuOpen(!menuOpen);
                    setNotifOpen(false);
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold hover:shadow-lg transition text-sm overflow-hidden border-2 border-transparent hover:border-blue-400"
                >
                  {profileData?.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-800 flex items-center justify-center">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl rounded-lg overflow-hidden animate-fadeIn">
                    <div className="px-4 py-3 bg-gray-100">
                      <p className="font-semibold text-sm truncate">{user.email}</p>
                      <p className="text-xs text-gray-500 truncate">Tài khoản của bạn</p>
                    </div>

                    <div className="py-2">
                      <Link
                        href={`/profile/${user.id}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition"
                      >
                        <User size={18} className="text-gray-600" />
                        <span className="text-sm font-medium">Trang cá nhân</span>
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition text-red-600"
                      >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Đăng nhập
              </Link>

              <Link
                href="/signup"
                className="px-5 py-2 bg-blue-800 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                Đăng ký
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg animate-fadeIn">
          <div className="px-4 py-3 space-y-1">
            {/* View Mode Toggle - Mobile */}
            <div className="flex items-center gap-2 mb-3 bg-gray-100 p-1 rounded-lg">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md transition ${
                  !isGalleryView
                    ? 'bg-white shadow-sm text-blue-600 font-medium'
                    : 'text-gray-600'
                }`}
              >
                <List size={18} />
                <span className="text-sm">Bài viết</span>
              </Link>
              <Link
                href="/gallery"
                onClick={() => setMenuOpen(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md transition ${
                  isGalleryView
                    ? 'bg-white shadow-sm text-blue-600 font-medium'
                    : 'text-gray-600'
                }`}
              >
                <LayoutGrid size={18} />
                <span className="text-sm">Thư viện</span>
              </Link>
            </div>

            {user ? (
              <>
                <div className="px-3 py-2 mb-2 bg-gray-50 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {profileData?.avatar_url ? (
                      <img
                        src={profileData.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-sm truncate flex-1">{user.email}</p>
                </div>

                <Link
                  href="/notifications"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition"
                >
                  <Bell size={20} />
                  <span className="font-medium">Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  href={`/profile/${user.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition"
                >
                  <User size={20} />
                  <span className="font-medium">Trang cá nhân</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition text-red-600"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Đăng nhập
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition text-center font-medium"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}