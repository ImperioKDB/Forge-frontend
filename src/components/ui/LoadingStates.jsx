'use client'

import { useState, useEffect } from 'react'

function PulseDots({ color = 'var(--accent)', size = 6 }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {[0,1,2].map(i => (
        <span key={i} style={{ display:'inline-block', width:`${size}px`, height:`${size}px`, borderRadius:'50%', background:color, animation:`forge-pulse 1.4s ease-in-out ${i*0.2}s infinite` }} />
      ))}
    </div>
  )
}

function ProgressBar({ percent }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ height:'3px', background:'var(--bg-border)' }}
      role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ height:'100%', width:`${percent}%`, background:'var(--accent)', transition:'width 600ms cubic-bezier(0.16,1,0.3,1)', borderRadius:'999px' }} />
    </div>
  )
}

function StepList({ steps, currentStep }) {
  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => {
        const done = i < currentStep, current = i === currentStep
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="shrink-0 flex items-center justify-center rounded-full"
              style={{ width:'20px', height:'20px', background: done?'var(--success)':current?'var(--accent-dim)':'transparent', border: done?'none':current?'1px solid var(--accent)':'1px solid var(--bg-border)' }}
              aria-hidden="true">
              {done ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5.5L4 7.5L8 3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:current?'var(--accent)':'var(--bg-border)', display:'block', animation:current?'forge-pulse 1.4s ease-in-out infinite':'none' }} />
              )}
            </div>
            <span className="font-body text-xs" style={{ color:done?'var(--text-muted)':current?'var(--text-primary)':'var(--text-muted)', textDecoration:done?'line-through':'none', opacity:i>currentStep?0.5:1 }}>{step}</span>
          </div>
        )
      })}
    </div>
  )
}

export function IndexingLoader({ repoName, fileCount = 0, totalFiles }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => { const t = setInterval(() => setElapsed(s => s+1), 1000); return () => clearInterval(t) }, [])
  const percent = totalFiles ? Math.min(95, Math.round((fileCount/totalFiles)*100)) : Math.min(90, elapsed*2)
  const mins = Math.floor(elapsed/60), secs = elapsed%60
  return (
    <div className="flex flex-col gap-5 p-5 rounded-xl" style={{ background:'var(--bg-surface)', border:'1px solid var(--bg-border)', maxWidth:'420px' }} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background:'var(--accent-dim)', border:'1px solid rgba(232,103,26,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M14 2v6h6M8 13h8M8 17h5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className="font-body text-sm font-medium" style={{ color:'var(--text-primary)' }}>Indexing repository</p>
          {repoName && <p className="font-mono text-xs" style={{ color:'var(--text-muted)' }}>{repoName}</p>}
        </div>
        <div className="ml-auto"><PulseDots /></div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs" style={{ color:'var(--text-muted)' }}>{fileCount > 0 ? `${fileCount.toLocaleString()} files read` : 'Reading files...'}</span>
          <span className="font-mono text-xs" style={{ color:'var(--text-muted)' }}>{mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}</span>
        </div>
        <ProgressBar percent={percent} />
      </div>
      <p className="font-body text-xs leading-relaxed" style={{ color:'var(--text-secondary)' }}>
        Forge is reading every file in your repository to understand your codebase before making any changes. Large repos may take 1-3 minutes.
      </p>
    </div>
  )
}

export function PlanningLoader({ streamContent = '' }) {
  const steps = ['Reading codebase context','Analysing affected files','Identifying dependencies','Drafting subtask plan']
  const step = streamContent.length === 0 ? 0 : streamContent.length < 100 ? 1 : streamContent.length < 400 ? 2 : 3
  return (
    <div className="flex flex-col gap-5 p-5 rounded-xl" style={{ background:'var(--bg-surface)', border:'1px solid var(--bg-border)', maxWidth:'420px' }} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background:'var(--accent-dim)', border:'1px solid rgba(232,103,26,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 11l3 3L22 4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-body text-sm font-medium" style={{ color:'var(--text-primary)' }}>AI is planning changes</p>
          <p className="font-body text-xs" style={{ color:'var(--text-muted)' }}>Usually 20-60 seconds</p>
        </div>
        <PulseDots />
      </div>
      <StepList steps={steps} currentStep={step} />
      {streamContent && (
        <div className="p-3 rounded-lg font-mono text-xs leading-relaxed overflow-hidden" style={{ background:'var(--bg-base)', border:'1px solid var(--bg-border)', color:'var(--text-secondary)', maxHeight:'100px', maskImage:'linear-gradient(to bottom,black 50%,transparent 100%)' }} aria-hidden="true">
          {streamContent}
          <span style={{ display:'inline-block', width:'6px', height:'1em', background:'var(--accent)', verticalAlign:'text-bottom', marginLeft:'2px', animation:'forge-blink 1s step-end infinite' }} />
        </div>
      )}
      <p className="font-body text-xs" style={{ color:'var(--text-muted)' }}>You will review and approve the plan before any code is written.</p>
    </div>
  )
}

export function CodingLoader({ tasks = [], activeTask, streamContent = '' }) {
  const done = tasks.filter(t => ['done','awaiting_approval'].includes(t.status)).length
  const total = tasks.length
  const percent = total > 0 ? Math.round((done/total)*100) : 0
  return (
    <div className="flex flex-col gap-5 p-5 rounded-xl" style={{ background:'var(--bg-surface)', border:'1px solid var(--bg-border)', maxWidth:'480px' }} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background:'var(--accent-dim)', border:'1px solid rgba(232,103,26,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M14 6l-4 12" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-body text-sm font-medium" style={{ color:'var(--text-primary)' }}>Writing code</p>
          {total > 0 && <p className="font-mono text-xs" style={{ color:'var(--text-muted)' }}>{done} / {total} subtasks complete</p>}
        </div>
        <PulseDots />
      </div>
      {total > 0 && <ProgressBar percent={percent} />}
      {activeTask && (
        <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ background:'var(--bg-base)', border:'1px solid rgba(232,103,26,0.15)' }}>
          <div className="flex items-center gap-2">
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--accent)', animation:'forge-pulse 1.4s ease-in-out infinite', display:'inline-block', flexShrink:0 }} aria-hidden="true" />
            <span className="font-mono text-xs" style={{ color:'var(--accent)' }}>Now coding</span>
          </div>
          <p className="font-mono text-xs" style={{ color:'var(--text-secondary)' }}>{activeTask.file_path}</p>
          {activeTask.instruction && <p className="font-body text-xs leading-relaxed line-clamp-2" style={{ color:'var(--text-muted)' }}>{activeTask.instruction}</p>}
        </div>
      )}
      {streamContent && (
        <div className="p-3 rounded-lg font-mono text-xs leading-relaxed overflow-hidden" style={{ background:'var(--bg-base)', border:'1px solid var(--bg-border)', color:'var(--text-secondary)', maxHeight:'100px', maskImage:'linear-gradient(to bottom,black 50%,transparent 100%)' }} aria-hidden="true">
          {streamContent.slice(-400)}
          <span style={{ display:'inline-block', width:'6px', height:'1em', background:'var(--accent)', verticalAlign:'text-bottom', marginLeft:'2px', animation:'forge-blink 1s step-end infinite' }} />
        </div>
      )}
      <p className="font-body text-xs" style={{ color:'var(--text-muted)' }}>Nothing is pushed to GitHub until you approve each subtask.</p>
    </div>
  )
}

export function SessionLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20" role="status" aria-label="Loading session...">
      <div style={{ width:'36px', height:'36px', border:'2px solid var(--bg-border)', borderTop:'2px solid var(--accent)', borderRadius:'50%', animation:'forge-spin 0.8s linear infinite' }} aria-hidden="true" />
      <p className="font-mono text-sm" style={{ color:'var(--text-muted)' }}>Loading session...</p>
    </div>
  )
}

export function ConnectingState({ label = 'Connecting to model...' }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" role="status" aria-live="polite">
      <PulseDots size={5} />
      <span className="font-mono text-xs" style={{ color:'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

export function GenericSpinner({ label = 'Loading...', size = 16, color = 'var(--text-muted)' }) {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-label={label}>
      <span style={{ display:'inline-block', width:`${size}px`, height:`${size}px`, border:`2px solid ${color}`, borderTop:'2px solid transparent', borderRadius:'50%', animation:'forge-spin 0.8s linear infinite' }} aria-hidden="true" />
      <span className="font-mono text-xs" style={{ color }}>{label}</span>
    </span>
  )
}
