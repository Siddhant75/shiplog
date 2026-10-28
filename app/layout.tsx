import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShipLog — Voice Dev Journal & Portfolio Engine',
  description: 'Turn 60-second voice daily recaps into verified portfolios, standups, and decision logs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  );
}
