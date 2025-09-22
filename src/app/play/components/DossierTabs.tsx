// app/play/components/DossierTabs.tsx
'use client';
import { useEffect, useState } from 'react';
import ClueCard from './ClueCard';
import SuspectCard, {Suspect} from './SuspectCard';
import CaseFile, {CaseFileData} from './CaseFile';

type Tab = 'clues'|'suspects'|'file';

interface CaseUpdateEventDetail {
  clues?: string[];
  suspects?: Suspect[];
  background?: CaseFileData;
  suspectsCount?: number;
}

declare global {
  interface WindowEventMap {
    'case:update': CustomEvent<CaseUpdateEventDetail>;
  }
}

export default function DossierTabs() {
  const [tab, setTab] = useState<Tab>('clues');
  const [clues,setClues] = useState<string[]>([]);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [file, setFile] = useState<CaseFileData>({});

  useEffect(() => {
    const handler = (e:WindowEventMap['case:update']) => {
      const d = e.detail;
      // if (d?.clues && Array.isArray(d.clues)) {
      //   setClues(prev => [...prev, ...d.clues]);
      // }
      if (d?.suspects) setSuspects(d.suspects);
      if (d?.clues) setClues(d.clues);
      if (d?.background) setFile(prev => ({...prev, ...d.background}));
      if (d?.suspectsCount) setFile(prev => ({...prev, suspectsCount:d.suspectsCount}));
    };
    window.addEventListener('case:update', handler);
    return () => window.removeEventListener('case:update', handler);
  }, []);

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="h-12 border-b border-neutral-800 flex items-center flex-shrink-0">
        {[
          {k:'clues', label:'线索'},
          {k:'suspects', label:'嫌疑人'},
          {k:'file', label:'案情档案'},
        ].map(t=>(
          <button key={t.k}
                  onClick={()=>setTab(t.k as Tab)}
                  className={`h-full px-4 ${tab===t.k?'text-blue-400 border-b-2 border-blue-400':'text-neutral-400'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {tab==='clues' && clues.map((c,i)=>(<ClueCard key={i} clue={c}/>))}
        {tab==='suspects' && suspects.map((s,i)=>(<SuspectCard key={i} suspect={s}/>))}
        {tab==='file' && <CaseFile data={file} />}
      </div>

      <div className="h-16 border-t border-neutral-800 flex items-center justify-between px-3 flex-shrink-0">
        <button className="px-3 py-2 rounded-md border border-neutral-700 hover:bg-neutral-900">返回调查</button>
        <button className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500">提交推理</button>
      </div>
    </div>
  );
}