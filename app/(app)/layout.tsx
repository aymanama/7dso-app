import { BottomTabBar } from '@/components/nav/BottomTabBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full min-h-[812px] flex flex-col">
      <div className="flex-1 overflow-y-auto pb-24">{children}</div>
      <BottomTabBar />
    </div>
  );
}
