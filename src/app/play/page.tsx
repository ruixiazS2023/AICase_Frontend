'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import ChatPanel from './components/ChatPanel';
import DossierTabs from './components/DossierTabs';

export default function PlayPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    // 记住上次拖拽的宽度（可选）
    const saved = typeof window !== 'undefined' ? localStorage.getItem('split-left-pct') : null;
    return saved ? Math.min(80, Math.max(20, Number(saved))) : 60;
  });
  useEffect(() => {
    localStorage.setItem('split-left-pct', String(Math.round(leftWidth)));
  }, [leftWidth]);

  const handleDrag = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startPct = leftWidth;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const nextPct = (((startPct / 100) * rect.width) + dx) / rect.width * 100;
      // 限制 20%~80%
      const clamped = Math.min(80, Math.max(20, nextPct));
      setLeftWidth(clamped);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.classList.remove('select-none', 'cursor-col-resize');
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    // 拖拽时禁用选中，改变光标
    document.body.classList.add('select-none', 'cursor-col-resize');
  };

  return (
    <div className="h-dvh bg-neutral-950 text-neutral-100">
      <header className="h-14 border-b border-neutral-800 flex items-center px-4">
        <div className="font-semibold tracking-wide">AICase · 调查现场</div>
        <div className="ml-auto flex items-center gap-2 text-sm text-neutral-400">
          <span>让故事活过来</span>
          <button
            onClick={() => {
              if (confirm('确定要退出当前案件并返回主页吗？')) router.push('/');
            }}
            className="hover:text-red-400 transition-colors"
            title="返回主页"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 关键：不用 grid-cols-12；用三列模板 = 左 | 4px 分隔 | 右 */}
      <main
        ref={containerRef}
        className="h-[calc(100dvh-3.5rem)] min-h-0 grid overflow-hidden w-full"
        style={{ gridTemplateColumns: `${leftWidth}% 4px ${100 - leftWidth}%` }}
      >
        {/* 左侧：聊天面板（去掉 col-span-*） */}
        <section className="min-h-0 overflow-hidden border-r border-neutral-800">
          <ChatPanel />
        </section>

        {/* 分隔条：固定 4px，按下拖动 */}
        <div
          onMouseDown={handleDrag}
          role="separator"
          aria-orientation="vertical"
          className="h-full bg-neutral-700 hover:bg-blue-500 cursor-col-resize"
          title="拖动调整宽度"
        />

        {/* 右侧：卷宗面板（去掉 col-span-*） */}
        <aside className="min-h-0 overflow-hidden">
          <DossierTabs />
        </aside>
      </main>
    </div>
  );
}