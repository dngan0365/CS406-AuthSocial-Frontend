import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';


const inter = Inter({ subsets: ['latin'] });


export const metadata: Metadata = {
  title: 'AuthSocialApp',
  description: 'Chia sẻ khoảnh khắc của bạn',
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="vi">
  <body className={`${inter.className} bg-gray-100`}>
    <Header />
    <main className="min-h-screen pt-6 pb-12 flex justify-center">
      <div className="w-full max-w-3xl px-4">{children}</div>
    </main>
    </body>
</html>
);
}