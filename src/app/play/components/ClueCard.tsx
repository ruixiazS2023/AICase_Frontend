// ClueCard.tsx
// export type Clue = {
//   id: string;
//   title: string;
//   body: string;
//   tags?: string[]; // tags为可选的字符串数组
// }

export default function ClueCard({clue}:{clue:string}) {
  return (
    <div className="border border-neutral-800 rounded-lg p-3 bg-neutral-900">
      {/*<div className="text-sm text-neutral-400">{clue.id}</div>*/}
      {/*<div className="font-medium">{clue.title}</div>*/}
      <div className="text-sm text-neutral-300 mt-1">{clue}</div>
    {/*  {clue.tags?.length ? <div className="mt-2 text-xs text-neutral-500">#{clue.tags.join(' #')}</div> : null}*/}
    </div>
  );
}