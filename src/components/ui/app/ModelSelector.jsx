"use client"

import { useState } from "react"

const SUGGESTED_MODELS = {
  planner: [
    { id: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B (Free)" },
    { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron Super 120B (Free)" },
    { id: "qwen/qwen3-next-80b-a3b-instruct:free", label: "Qwen3 Next 80B (Free)" },
    { id: "nousresearch/hermes-3-llama-3.1-405b:free", label: "Hermes 3 405B (Free)" },
    { id: "moonshotai/kimi-k2.6:free", label: "Kimi K2.6 (Free)" },
    { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (Free)" },
    { id: "z-ai/glm-4.5-air:free", label: "GLM-4.5 Air (Free)" },
    { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", label: "Nemotron Nano Omni 30B Reasoning (Free)" },
    { id: "liquid/lfm-2.5-1.2b-thinking:free", label: "LFM 2.5 1.2B Thinking (Free)" },
  ],
  coder: [
    { id: "qwen/qwen3-coder:free", label: "Qwen3 Coder (Free)" },
    { id: "poolside/laguna-m.1:free", label: "Laguna M.1 (Free)" },
    { id: "poolside/laguna-xs.2:free", label: "Laguna XS.2 (Free)" },
    { id: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B (Free)" },
    { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", label: "Dolphin Mistral 24B Venice (Free)" },
    { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B (Free)" },
    { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B (Free)" },
    { id: "nvidia/nemotron-3-nano-30b-a3b:free", label: "Nemotron Nano 30B (Free)" },
    { id: "nvidia/nemotron-nano-12b-v2-vl:free", label: "Nemotron Nano 12B VL (Free)" },
    { id: "nvidia/nemotron-nano-9b-v2:free", label: "Nemotron Nano 9B (Free)" },
    { id: "liquid/lfm-2.5-1.2b-instruct:free", label: "LFM 2.5 1.2B Instruct (Free)" },
    { id: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B (Free)" },
  ],
}

/**
 * FORGE — ModelPicker
 *
 * Select with a "Custom model…" escape hatch. Focus ring uses outline
 * (no shadow-glow). Custom input is mono since it's a literal model ID.
 */
function ModelPicker({ label, value, onChange, suggestions }) {
  const [custom, setCustom] = useState(false)
  const isCustom = !suggestions.find((s) => s.id === value)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</label>

      {!custom && !isCustom ? (
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === "__custom__") {
              setCustom(true)
            } else {
              onChange(e.target.value)
            }
          }}
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-secondary transition-colors duration-fast focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {suggestions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
          <option value="__custom__">Custom model…</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. mistralai/mistral-7b-instruct"
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2.5 font-mono text-sm text-secondary placeholder-muted transition-colors duration-fast focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <button
            onClick={() => {
              setCustom(false)
              onChange(suggestions[0].id)
            }}
            className="rounded-md border border-border px-2.5 py-2 text-xs text-muted transition-colors duration-fast hover:border-accent-line hover:text-secondary"
            aria-label="Reset to suggested models"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * FORGE — ModelSelector
 *
 * Panel-rule frame around two ModelPickers — Planner and Coder. The
 * panel-rule treatment ties this to the "unit of the system" visual
 * language used for files/subtasks elsewhere.
 */
export default function ModelSelector({ plannerModel, coderModel, onPlannerChange, onCoderChange }) {
  return (
    <div className="flex flex-col gap-3">
      <label className="font-mono text-[11px] uppercase tracking-widest text-muted">Models</label>
      <div className="panel-rule flex flex-col gap-4 bg-surface p-4">
        <ModelPicker label="Planner" value={plannerModel} onChange={onPlannerChange} suggestions={SUGGESTED_MODELS.planner} />
        <ModelPicker label="Coder" value={coderModel} onChange={onCoderChange} suggestions={SUGGESTED_MODELS.coder} />
      </div>
    </div>
  )
}
