// app/play/components/ChatPanel.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { startCase } from '@/app/lib/api';
import type { StartCaseResp } from '@/app/model/StartCaseResp';

type Role = 'system' | 'npc' | 'ally' | 'you';
type Msg = { role: Role; text: string };
type Action = 'inspect'|'interrogate'|'present'|'review'|'move'|'ask'|'accuse'|'help';
type ActArgs = {
  targetId?: string;
  evidenceIds?: string[];
  query?: string;
}
type ActPayload = | {rawText: string} | {action: Action; args?: ActArgs};

type Chip = {
  action: Action;
  label: string;
  args?: Record<string, unknown>;
};

export default function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const [input, setInput] = useState('');
  const [chips, setChips] = useState<Chip[]>([
    // 首次进入的默认引导（后端也会在 done 里下发替换它们）
    { action:'inspect', label:'勘察现场' },
    { action:'review', label:'查看线索' },
    { action:'interrogate', label:'盘问李昂', args:{ targetId:'suspect:李昂' } },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const streamMsgRef = useRef<{role: Role; text: string} | null>(null);
  const rafRef = useRef<number | null>(null);

  function startStreamRole(role: Role) {
    streamMsgRef.current = { role, text: '' };
    // 先插入一个空消息占位，后续只更新这条
    setMessages(m => [...m, { role, text: '' }]);
  }

  function appendToken(token: string) {
    if (!streamMsgRef.current) return;
    streamMsgRef.current.text += token;

    // 用 rAF 合并刷新，减少频繁 setState
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        setMessages(m => {
          if (!streamMsgRef.current) return m;
          const next = m.slice();
          next[next.length - 1] = {
            role: streamMsgRef.current.role,
            text: streamMsgRef.current.text,
          };
          return next;
        });
        rafRef.current = null;
      });
    }
  }

  function endStream() {
    streamMsgRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }
  // 进入场景：/start_case
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const s: StartCaseResp = await startCase();
        setSessionId(s.caseId);
        setMessages(m => [...m, { role:'system', text:`案件「${s.background.title}」已建立。` }]);

        // 右侧卷宗初始化
        window.dispatchEvent(new CustomEvent('case:update', {
          detail: {
            background: s.background,
            clues: s.clues,
            suspects: s.suspects
          }
        }));
      } catch (e) {
        console.error('startCase failed', e);
        setMessages(m => [...m, { role:'system', text:'案件初始化失败，请重试。' }]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages, isStreaming]);

  /** —— SSE 封装：与后端 /act/stream 交互 —— */
  const actStream = async (payload: ActPayload) => {
    if (!sessionId) return;
    // 这里用 fetch+ReadableStream 更通用；如果你已有 useSSE hook，也可替换为它
    setIsStreaming(true);
    const requestBody = 'rawText' in payload
      ? { sessionId, rawText: payload.rawText }
      : { sessionId, action: payload.action, args: payload.args };

    // 我们通过一个本地 API 路由代理 POST→SSE，避免用 query 传 JSON（见文末可选路由）
    const res = await fetch('http://127.0.0.1:8000/api/act/stream', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.body) { setIsStreaming(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const flushLine = (line: string) => {
      if (!line.startsWith('data:')) return;
      try {
        const evt = JSON.parse(line.slice(5).trim()); // 去掉 'data:'
        // evt 里应包含 {event:"token"|"done", data:{...}}；也可让后端发 "event:" 行，这里做最小解析
        const { event, data } = evt;

        if (event === 'token') {
          const role: Role =
            data.speaker?.role === 'npc' ? 'npc' :
              data.speaker?.role === 'ally' ? 'ally' : 'system';
          const text: string = data.text ?? '';
          if (!text) return;
          if (!streamMsgRef.current) {
            // 新一轮对话开始
            startStreamRole(role);
          } else if (streamMsgRef.current.role !== role) {
            // 角色切换，结束上一轮，开启新轮
            endStream();
            startStreamRole(role);
          }
          // 追加 token
          appendToken(text);
        }

        if (event === 'done') {
          // chips 更新
          const nextChips: Chip[] = data.uiHints?.suggestedChips ?? [];
          if (nextChips.length) setChips(nextChips);

          // 卷宗同步（newClues/suspects 等）
          window.dispatchEvent(new CustomEvent('case:update', { detail: data }));

          // 结束对话流
          endStream();
          setIsStreaming(false);
        }
      } catch {}
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // 逐行处理伪 SSE（后端建议按 "\n\n" 包一条事件）
      const parts = buffer.split('\n\n');
      for (let i=0; i<parts.length-1; i++) flushLine(parts[i].trim());
      buffer = parts[parts.length-1];
    }

    setIsStreaming(false);
  };

  /** 发送自然语言输入（rawText） */
  const sendRaw = async () => {
    if (!sessionId || !input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role:'you', text:userMsg }]);
    setInput('');
    await actStream({ rawText: userMsg });
  };

  /** 点选建议 Chip（规范动作） */
  const sendChip = async (c: Chip) => {
    if (!sessionId || isStreaming) return;
    // 在对话里也回显一下动作（可选）
    setMessages(m => [...m, { role:'you', text: `【${c.label}】` }]);
    await actStream({ action: c.action, args: c.args ?? {} });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-neutral-400">
            <div>
              <div className="w-10 h-10 border-4 border-neutral-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              案件加载中...
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'you' ? 'text-right' : ''}>
                <span className={`inline-block rounded-2xl px-3 py-2 max-w-[75%] break-words
                  ${m.role==='you' ? 'bg-blue-600/30'
                  : m.role==='npc' ? 'bg-neutral-800'
                    : m.role==='ally' ? 'bg-emerald-900/30'
                      : 'text-neutral-400'}`}>
                  {m.text}
                </span>
              </div>
            ))}
            {isStreaming && (
              <div className="text-neutral-500 text-sm">对方正在输入…</div>
            )}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* 建议动作 Chips */}
      {!isLoading && (
        <div className="border-t border-neutral-800 px-3 py-2">
          <div className="flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <button
                key={i}
                onClick={() => sendChip(c)}
                disabled={isStreaming}
                className="px-3 py-1 text-sm rounded-full border border-neutral-700 hover:bg-neutral-800 disabled:opacity-60"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区 */}
      <div className="h-16 border-t border-neutral-800 px-3 flex items-center gap-2">
        <input
          className={`flex-1 rounded-md px-3 py-2 outline-none ${isLoading ? 'bg-neutral-900/50 border-neutral-700' : 'bg-neutral-900 border border-neutral-800'}`}
          placeholder={isLoading ? '加载中...' : '直接输入问题，或输入 / 查看指令'}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>!isLoading && e.key==='Enter' && sendRaw()}
          disabled={isLoading || isStreaming}
        />
        <button
          onClick={sendRaw}
          disabled={isLoading || isStreaming}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition disabled:opacity-60"
        >
          {isStreaming ? '等待…' : '发送'}
        </button>
      </div>
    </div>
  );
}