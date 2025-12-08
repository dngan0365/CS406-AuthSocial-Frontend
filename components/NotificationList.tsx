'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getNotifications, markNotificationAsRead, getProfile } from '@/lib/api';
import type { Notification } from '@/types';
import { Heart, MessageCircle, User } from 'lucide-react';

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  // ✅ Load notifications and fetch actor profiles using getProfile
  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      
      // Fetch actor profiles using getProfile for notifications that have actor_id
      const notificationsWithActors = await Promise.all(
        data.map(async (notif: Notification) => {
          // If notification has actor_id but no actor data, fetch it
          if (notif.actor_id && !notif.actor) {
            try {
              const actorProfile = await getProfile(notif.actor_id);
              return {
                ...notif,
                actor: actorProfile // ✅ Set actor directly from getProfile
              };
            } catch (error) {
              console.error(`Failed to fetch actor profile for ${notif.actor_id}:`, error);
              return notif;
            }
          }
          // If actor data already exists, keep it
          return notif;
        })
      );
      
      setNotifications(notificationsWithActors);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle size={20} className="text-blue-500" />;
      case 'follow':
        return <User size={20} className="text-green-500" />;
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
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // ✅ Get actor display name with fallback
  const getActorName = (notification: Notification) => {
    return notification.actor?.display_name || 
           notification.actor?.username || 
           'Người dùng';
  };

  // ✅ Get actor avatar initial with fallback
  const getActorInitial = (notification: Notification) => {
    const name = notification.actor?.username || 
                 notification.actor?.display_name || 
                 'U';
    return name[0]?.toUpperCase() || 'U';
  };

  // ✅ Get actor avatar URL
  const getActorAvatar = (notification: Notification) => {
    return notification.actor?.avatar_url;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Chưa có thông báo nào
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <Link
          key={notification.id}
          href={notification.post_id ? `/post/${notification.post_id}` : '#'}
          onClick={() => handleNotificationClick(notification.id)}
          className={`block p-4 rounded-lg hover:bg-gray-50 transition ${
            !notification.is_read ? 'bg-blue-50' : 'bg-white'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* ✅ Actor Avatar with image support */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-gray-200">
              {getActorAvatar(notification) ? (
                <img
                  src={getActorAvatar(notification)}
                  alt="Actor"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {getActorInitial(notification)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getIcon(notification.type)}
                {/* ✅ Actor Name with fallback */}
                <p className="font-medium text-sm">
                  {getActorName(notification)}
                </p>
              </div>
              
              <p className="text-sm text-gray-600 mb-1">
                {notification.body || `đã ${notification.type === 'like' ? 'thích' : notification.type === 'comment' ? 'bình luận' : 'theo dõi'} bài viết của bạn`}
              </p>
              
              <p className="text-xs text-gray-500">
                {formatDate(notification.created_at)}
              </p>
            </div>

            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}