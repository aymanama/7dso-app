import { BottomTabBar } from '@/components/nav/BottomTabBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex flex-col" style={{ height: '100%', minHeight: '100svh' }}>
      <div className="flex-1 overflow-y-auto pb-4">{children}</div>
      <BottomTabBar />
    </div>
  );
}
