// app/play/components/ChatPanel.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { startCase, actOnce } from '@/app/lib/api';
import {StartCaseResp} from "@/app/model/StartCaseResp";

export default function ChatPanel() {
  const [messages, setMessages] = useState<{role:'system'|'npc'|'you'; text:string}[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const s: StartCaseResp = await startCase();
        console.log(s)// 调 /start_case 返回 sessionId 等
        setSessionId(s.caseId);
        setMessages(m => [...m, {role: 'system', text: `案件「${s.background.title}」已建立。`}]);
        window.dispatchEvent(new CustomEvent('case:update', {
          detail: {
            // 案件档案数据（匹配 CaseFileData 类型）
            background: s.background, // 假设 s.background 是案件背景
            suspectsCount: 3,
            // 初始线索和嫌疑人
            clues: s.clues, // 假设 s.initialClues 是初始线索
            suspects: s.suspects   // 假设 s.suspects 是嫌疑人列表
          }
        }));
      } catch (e) {
        console.error('startCase failed', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  const send = async () => {
    if (!sessionId || !input) return;
    const userMsg = input;
    setMessages(m => [...m, {role:'you', text:userMsg}]);
    setInput('');

    const res = await actOnce({ sessionId, action:'interrogate', question:userMsg });
    setMessages(m => [...m, {role:'npc', text: res.narrative?.[0]?.text ?? '……'}]);
    // 可同时把 res.clues / suspects 推到全局状态（用于右侧标签）
    window.dispatchEvent(new CustomEvent('case:update', { detail: res }));
  };

  return (
    <div className="h-full flex flex-col">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-neutral-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-neutral-400">案件加载中...</div>
          </div>
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'you' ? 'text-right' : ''}>
            <span className={`inline-block rounded-2xl px-3 py-2 max-w-[75%] break-words
              ${m.role==='you' ? 'bg-blue-600/30' : m.role==='npc' ? 'bg-neutral-800' : 'text-neutral-400'}`}>
              {m.text}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
        )}
      {/* 加载时禁用输入框和发送按钮 */}
      <div className="h-16 border-t border-neutral-800 px-3 flex items-center gap-2">
        <input
          className={`flex-1 rounded-md px-3 py-2 outline-none ${isLoading ? 'bg-neutral-900/50 border-neutral-700' : 'bg-neutral-900 border border-neutral-800'}`}
          placeholder={isLoading ? '加载中...' : '输入要审问的问题，或输入 /investigate 现场…'}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>!isLoading && e.key==='Enter'&&send()}
          disabled={isLoading} // 加载时禁用
        />
        <button onClick={send}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition">发送</button>
      </div>
    </div>
  );
}