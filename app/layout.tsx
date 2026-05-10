import type { Metadata } from 'next';
import { JetBrains_Mono, Inter } from 'next/font/google';
import './globals.css';

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600', '700', '800'],
});
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: '7DSO · Smart Combat Strategist',
  description: 'Optimal team builds for Seven Deadly Sins: Origin',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '7DSO',
  },
  themeColor: '#0B0E14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrains.variable} ${inter.variable}`}>
      <body className="bg-[#06080D] flex min-h-svh items-center justify-center p-6">
        <div
          className="w-full max-w-[430px] min-h-[812px] relative overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(181,140,255,0.08) 0%, transparent 60%), #0B0E14',
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
