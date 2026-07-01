// src/components/blocks/AIAssistantBlock.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import type { Section, AIAssistantContent } from '@/types'
import { SectionWrap, SectionEyebrow, Heading, FadeUp } from './shared'

interface ChatMsg { role: 'user' | 'assistant'; content: string }

export function AIAssistantBlock({ section }: { section: Section }) {
  const content = section.content as unknown as AIAssistantContent
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: "I'm Ismail's AI representative. Ask me anything about his journey, goals, projects, or how he thinks." },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setLoading(true)
    const nextMessages = [...messages, { role: 'user' as const, content: msg }]
    setMessages(nextMessages)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.slice(-10) }),
      })
      const data = await res.json()

      if (!data.success) {
        if (data.code === 'AI_NOT_CONFIGURED') setAiEnabled(false)
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Something went wrong.' }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <SectionWrap id={section.slug}>
      <FadeUp><SectionEyebrow text={section.label} /></FadeUp>
      <FadeUp delay={0.1}><Heading>Ask <span className="text-accent">anything</span></Heading></FadeUp>
      <FadeUp delay={0.15}>
        <p className="text-muted text-base leading-relaxed max-w-[500px] mb-10">{content.subheading}</p>
      </FadeUp>

      <FadeUp delay={0.2}>
        <div className="max-w-[660px] bg-card border border-border rounded-[20px] overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4F6EF7, #F0A500)' }}
            >
              <span className="text-white text-[13px] font-extrabold font-display">IS</span>
            </div>
            <div>
              <div className="font-display text-sm font-bold text-[var(--color-text)]">Ismail AI</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: aiEnabled ? '#22C55E' : '#7A869A' }} />
                <span className="text-muted text-[11px]">{aiEnabled ? 'Online · Powered by AI' : 'Setup required'}</span>
              </div>
            </div>
          </div>

          <div ref={chatRef} className="h-[340px] overflow-y-auto p-6 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-4 py-2.5 text-[13.5px] leading-relaxed"
                  style={{
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? '#4F6EF7' : '#0D1220',
                    color: '#EDF2FF',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-1.5 px-4 py-2.5 rounded-[16px_16px_16px_4px] w-fit" style={{ background: '#0D1220' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              {content.suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="bg-accent-glow border rounded-full px-3 py-1.5 text-xs cursor-pointer text-accent"
                  style={{ borderColor: 'rgba(79,110,247,0.2)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="px-6 py-4 border-t border-border flex gap-2.5">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about Ismail..."
              className="flex-1 bg-surface border border-border rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--color-text)] outline-none focus:border-accent"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="bg-accent text-white border-none rounded-[10px] px-4.5 py-2.5 text-[13px] font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </FadeUp>
    </SectionWrap>
  )
}
