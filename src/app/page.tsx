// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100">
      <h1 className="text-3xl font-bold tracking-widest">AICase</h1>
      <p className="mt-2 text-neutral-400">让故事活过来 · AI 案件推理体验</p >

      <div className="mt-8 flex gap-4">
        <Link href="/play" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">
          开始新案件
        </Link>
        <Link href="/cases" className="px-4 py-2 rounded border border-neutral-600 hover:bg-neutral-800">
          案件包
        </Link>
      </div>
    </main>
  );
}
