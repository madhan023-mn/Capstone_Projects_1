import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SyncSpace | Real-Time Collaborative Workspace',
  description:
    'Notion and Figma inspired real-time collaborative workspace powered by Next.js, TipTap, Yjs CRDTs, PostgreSQL, and Redis.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%234f46e5%22><polygon points=%2213 2 3 14 12 14 11 22 21 10 12 10 13 2%22/></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      <body className="h-full min-h-screen flex flex-col font-sans">{children}</body>
    </html>
  );
}
