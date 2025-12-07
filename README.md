# SocialApp - Ứng dụng mạng xã hội đơn giản

Ứng dụng mạng xã hội được xây dựng với Next.js 14 và Supabase.

## 🚀 Tính năng

- ✅ Đăng ký / Đăng nhập
- ✅ Tạo bài viết (công khai / riêng tư)
- ✅ Upload hình ảnh / video
- ✅ Like bài viết
- ✅ Xem profile người dùng
- ✅ Thông báo
- ✅ Chỉnh sửa profile
- ✅ Xóa bài viết

## 📋 Yêu cầu

- Node.js 18+
- Tài khoản Supabase

## 🛠️ Cài đặt

### 1. Clone project

```bash
git clone <your-repo>
cd social-app
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Supabase

Tạo file `.env.local` và thêm thông tin Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Tạo Storage Bucket trong Supabase

Vào Supabase Dashboard > Storage > Tạo bucket mới:
- Tên bucket: `media`
- Public: ✅

### 5. Chạy ứng dụng

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

## 📁 Cấu trúc thư mục

```
social-app/
├── src/
│   ├── app/                 # Pages (App Router)
│   │   ├── page.tsx         # Trang chủ (feed)
│   │   ├── login/           # Trang đăng nhập
│   │   ├── signup/          # Trang đăng ký
│   │   ├── profile/[id]/    # Trang profile
│   │   ├── post/[id]/       # Chi tiết bài viết
│   │   └── notifications/   # Thông báo
│   │
│   ├── components/          # React components
│   │   ├── Header.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostForm.tsx
│   │   └── NotificationList.tsx
│   │
│   ├── lib/                 # Utilities
│   │   ├── supabase.ts      # Supabase client
│   │   └── api.ts           # API functions
│   │
│   └── types/               # TypeScript types
│       └── index.ts
```

## 🔑 API Functions

### Auth
- `signUp(email, password, username)` - Đăng ký
- `signIn(email, password)` - Đăng nhập
- `signOut()` - Đăng xuất

### Posts
- `getPosts(ownerId?)` - Lấy danh sách bài viết
- `getPost(id)` - Lấy chi tiết bài viết
- `createPost(content, isPrivate)` - Tạo bài viết
- `updatePost(id, content, isPrivate)` - Cập nhật bài viết
- `deletePost(id)` - Xóa bài viết

### Media
- `uploadMedia(postId, file, order)` - Upload media
- `deleteMedia(id, storagePath)` - Xóa media
- `getMediaUrl(path)` - Lấy public URL

### Likes
- `likePost(postId)` - Like bài viết
- `unlikePost(postId)` - Unlike bài viết
- `checkIfLiked(postId)` - Kiểm tra đã like chưa

### Profile
- `getProfile(id)` - Lấy thông tin profile
- `updateProfile(displayName, avatarUrl?)` - Cập nhật profile

### Notifications
- `getNotifications()` - Lấy danh sách thông báo
- `markNotificationAsRead(id)` - Đánh dấu đã đọc

## 🎨 Công nghệ sử dụng

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Language**: TypeScript

## 📝 Lưu ý

1. Đảm bảo đã chạy SQL schema trong Supabase
2. Tạo storage bucket `media` và set public
3. Enable Email Auth trong Supabase Dashboard
4. Có thể customize UI theo ý muốn

## 🚧 Tính năng có thể mở rộng

- [ ] Bình luận
- [ ] Follow/Unfollow
- [ ] Tìm kiếm
- [ ] Hashtags
- [ ] Stories
- [ ] Chat realtime
- [ ] AI kiểm tra ảnh
- [ ] Admin dashboard

## 📄 License

MIT