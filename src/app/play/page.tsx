// app/play/page.tsx
'use client';
import ChatPanel from './components/ChatPanel';
import DossierTabs from './components/DossierTabs';
import { useRouter } from "next/navigation";
import {LogOut} from "lucide-react";

export default function PlayPage() {
  const router = useRouter();
  return (
    <div className="h-dvh bg-neutral-950 text-neutral-100">
      <header className="h-14 border-b border-neutral-800 flex items-center px-4">
        {/* 左边：Logo/标题 */}
        <div className="font-semibold tracking-wide">
          AICase · 调查现场
        </div>

        {/* 右边：标语 + 退出按钮 */}
        <div className="ml-auto flex items-center gap-2 text-sm text-neutral-400">
          <span>让故事活过来</span>
          <button
            onClick={() => {
              if (confirm('确定要退出当前案件并返回主页吗？')) {
                router.push('/');
              }
            }}
            className="hover:text-red-400 transition-colors"
            title="返回主页"
          >
            <LogOut className="w-5 h-5"/>
          </button>
        </div>
      </header>
      <main className="h-[calc(100dvh-3.5rem)] min-h-0 grid grid-cols-12 overflow-hidden">
        <section className="col-span-7 border-r border-neutral-800 min-h-0 overflow-hidden">
          <ChatPanel/>
        </section>
        <aside className="col-span-5 min-h-0 overflow-hidden">
          <DossierTabs/>
        </aside>
      </main>
    </div>
  );
}