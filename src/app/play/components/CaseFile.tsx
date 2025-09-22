// app/play/components/CaseFile.tsx
'use client';
import { useMemo } from 'react';

export type CaseTimelineItem = { time: string; event: string };
export type CaseFileData = {
  title?: string;
  summary?: string;
  location?: string;
  timeOfCrime?: string;
  victim?: string;
  suspectsCount?: number;
  timeline?: CaseTimelineItem[];
  objectives?: string[];
  status?: 'open' | 'in_progress' | 'closed';
  tags?: string[];
};

export default function CaseFile({ data }: { data: CaseFileData }) {
  const statusLabel = useMemo(() => {
    switch (data.status) {
      case 'in_progress':
        return '调查中';
      case 'closed':
        return '已结案';
      default:
        return '未开始';
    }
  }, [data.status]);

  return (
    <div className="space-y-4">
      {/* 标题与状态 */}
      <header className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold tracking-wide">
            {data.title ?? '未命名案件'}
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            {data.summary ?? '暂无案情摘要。'}
          </p >
        </div>
        <span
          className={`select-none rounded-md px-2 py-1 text-xs border ${
            data.status === 'closed'
              ? 'border-emerald-700 text-emerald-400 bg-emerald-900/20'
              : data.status === 'in_progress'
                ? 'border-amber-700 text-amber-400 bg-amber-900/20'
                : 'border-neutral-700 text-neutral-400 bg-neutral-900'
          }`}
          title="案件状态"
        >
          {statusLabel}
        </span>
      </header>

      {/* 基本信息 */}
      <section className="grid grid-cols-2 gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
        <InfoRow label="案发地点" value={data.location ?? '—'} />
        <InfoRow label="案发时间" value={data.timeOfCrime ?? '—'} />
        <InfoRow
          label="受害者"
          value={data.victim ?? '—'}
        />
        <InfoRow
          label="嫌疑人数量"
          value={
            typeof data.suspectsCount === 'number' ? `${data.suspectsCount}` : '—'
          }
        />
        {data.tags?.length ? (
          <div className="col-span-2">
            <div className="text-xs text-neutral-500 mb-1">标签</div>
            <div className="flex flex-wrap gap-1">
              {data.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded border border-neutral-700 text-neutral-300"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* 时间线 */}
      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
        <div className="text-sm text-neutral-400 mb-2">案发时间线</div>
        {data.timeline?.length ? (
          <ul className="space-y-2">
            {data.timeline.map((it, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500/70" />
                <div className="flex-1">
                  <div className="text-xs text-neutral-500">{it.time}</div>
                  <div className="text-sm">{it.event}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-neutral-500">暂无记录。</div>
        )}
      </section>

      {/* 目标/进度 */}
      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
        <div className="text-sm text-neutral-400 mb-2">当前目标</div>
        {data.objectives?.length ? (
          <ul className="list-disc list-inside space-y-1 text-sm">
            {data.objectives.map((o, i) => (
              <li key={i} className="text-neutral-200">
                {o}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-neutral-500">暂无目标。</div>
        )}
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 min-h-6">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}