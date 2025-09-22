// app/play/components/SuspectCard.tsx
'use client';
import Image from 'next/image';
import { useMemo, useState } from 'react';

export type Suspect = {
  name: string;
  avatarUrl?: string;
  age?: number;
  relation?: string;   // 与受害者关系
  occupation?: string;
  motive?: string;
  alibi?: string;
  lastSeen?: string;   // 最后出现时间/地点
  credibility?: number; // 0-100（证词可信度）
  suspicion?: number;   // 0-100（嫌疑度）
  tags?: string[];
  description?: string;
};

export default function SuspectCard({ suspect }: { suspect: Suspect }) {
  const [expanded, setExpanded] = useState(false);
  const credColor = scaleColor(suspect.credibility ?? 50);
  const suspColor = scaleColor(suspect.suspicion ?? 50, true);

  return (
    <article className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
      {/* 头部 */}
      <div className="flex items-center gap-3">
        <Avatar name={suspect.name} src={suspect.avatarUrl} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{suspect.name}</h3>
            {suspect.tags?.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-700 text-neutral-400"
              >
                #{t}
              </span>
            ))}
          </div>
          <div className="text-xs text-neutral-500">
            {[
              suspect.age ? `${suspect.age} 岁` : null,
              suspect.occupation,
              suspect.relation ? `与受害者：${suspect.relation}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
        {/* 操作区 */}
        <div className="flex items-center gap-2">
          <button
            className="text-xs px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-800"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('case:interrogate', { detail: { suspectName: suspect.name } })
              )
            }
            title="发起审问"
          >
            审问
          </button>
          <button
            className="text-xs px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-800"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('case:mark_key', { detail: { suspectName: suspect.name } })
              )
            }
            title="标记为关键嫌疑人"
          >
            标记
          </button>
        </div>
      </div>

      {/* 指标条 */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Meter label="证词可信度" value={suspect.credibility ?? 50} colorClass={credColor} />
        <Meter label="嫌疑度" value={suspect.suspicion ?? 50} colorClass={suspColor} />
      </div>

      {/* 关键信息 */}
      <div className="mt-3 space-y-2 text-sm">
        {suspect.motive ? (
          <Row label="动机" text={suspect.motive} />
        ) : null}
        {suspect.alibi ? (
          <Row label="不在场证明" text={suspect.alibi} />
        ) : null}
        {suspect.lastSeen ? (
          <Row label="最后出现" text={suspect.lastSeen} />
        ) : null}
      </div>

      {/* 展开详情 */}
      <button
        className="mt-3 text-xs text-neutral-400 hover:text-neutral-200"
        onClick={() => setExpanded((s) => !s)}
      >
        {expanded ? '收起详情' : '展开详情'}
      </button>

      {expanded && (
        <div className="mt-2 rounded-md border border-neutral-800 bg-neutral-950 p-3">
          <div className="text-xs text-neutral-500 mb-1">备注</div>
          <p className="text-sm whitespace-pre-wrap">
            {suspect.description ?? '暂无备注。'}
          </p >
        </div>
      )}
    </article>
  );
}

/* 子组件与工具 */

function Avatar({ name, src }: { name: string; src?: string }) {
  const initial = useMemo(() => (name?.[0] ?? '?').toUpperCase(), [name]);
  if (src) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-neutral-800">
        <Image src={src} alt={name} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div className="h-10 w-10 rounded-full border border-neutral-800 bg-neutral-800 flex items-center justify-center">
      <span className="text-sm text-neutral-200">{initial}</span>
    </div>
  );
}

function Row({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 text-xs text-neutral-500 w-16">{label}</span>
      <span className="flex-1">{text}</span>
    </div>
  );
}

function Meter({
                 label,
                 value,
                 colorClass,
               }: {
  label: string;
  value: number;
  colorClass: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <div className="h-2 rounded bg-neutral-800 overflow-hidden">
        <div
          className={`h-full ${colorClass}`}
          style={{ width: `${v}%`, transition: 'width 200ms ease' }}
        />
      </div>
    </div>
  );
}

/** 根据数值返回颜色类：低=红/中=黄/高=绿；若 isSuspicion=true 则反向（高=红） */
function scaleColor(v: number, isSuspicion = false) {
  const val = Math.max(0, Math.min(100, v));
  const level =
    val < 34 ? 'low' : val < 67 ? 'mid' : 'high';

  const palette = {
    low: isSuspicion
      ? 'bg-emerald-600/70' // 嫌疑度低=绿
      : 'bg-rose-600/70',
    mid: 'bg-amber-500/80',
    high: isSuspicion
      ? 'bg-rose-600/80'   // 嫌疑度高=红
      : 'bg-emerald-600/80',
  } as const;

  return palette[level];
}