"use client"
import { useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList, ReferenceLine
} from "recharts"

type GoalEvent = {
  minute: number
  team: "vonds" | "opp"
  scorer: string
  assist: string
  preAssist: string
}

type HalfData = {
  label: string
  labels: string[]
  vonds: { packing: number[]; impact: number[] }
  opp:   { packing: number[]; impact: number[] }
  goals?: GoalEvent[]
}

export type TimelineData = {
  total?: HalfData | null
  halves?: HalfData[]
  noData?: boolean
  labels?: string[]
  vonds?: { packing: number[]; impact: number[] }
  opp?: { packing: number[]; impact: number[] }
}

function buildChartData(half: HalfData) {
  return half.labels.map((label, i) => ({
    t: label,
    vPack: half.vonds.packing[i] ?? null,
    vImp: half.vonds.impact[i] ?? null,
    oPack: half.opp.packing[i] ?? null,
    oImp: half.opp.impact[i] ?? null,
  }))
}

function minuteToLabel(minute: number): string {
  const bucket = Math.floor(minute / 5)
  return `${bucket * 5}-${(bucket + 1) * 5}`
}

const EndLabel = ({ x, y, value, color }: { x?: number; y?: number; value?: number; color: string }) => {
  if (value == null || value === 0) return null
  return (
    <text x={x} y={(y ?? 0) - 6} fill={color} fontSize={9} textAnchor="middle" fontWeight="600">
      {value}
    </text>
  )
}

const GoalLabel = ({ viewBox, goal }: { viewBox?: { x?: number; y?: number; height?: number }; goal: GoalEvent }) => {
  const x = viewBox?.x ?? 0
  const y = viewBox?.y ?? 20
  const color = goal.team === "vonds" ? "rgb(21,128,61)" : "rgb(100,116,139)"
  return (
    <g>
      <text x={x} y={y - 4} fill={color} fontSize={10} textAnchor="middle" fontWeight="700">⚽</text>
      <text x={x} y={y - 16} fill={color} fontSize={8} textAnchor="middle">{goal.scorer}</text>
    </g>
  )
}

function HalfChart({ half, opponent }: { half: HalfData; opponent: string }) {
  const data = buildChartData(half)
  const lastIdx = data.length - 1
  const goals = half.goals ?? []

  return (
    <div>
      {half.label && <p className="text-xs font-semibold text-muted-foreground mb-3">{half.label}</p>}
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 30, right: 16, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'rgb(148,163,184)' }}
            label={{ value: '経過時間', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: 'rgb(148,163,184)' }}
          />
          <YAxis tick={{ fontSize: 10, fill: 'rgb(148,163,184)' }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: 'var(--foreground)' }}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: 'rgb(148,163,184)', paddingTop: 8 }} iconSize={16} />

          {goals.map((g, i) => (
            <ReferenceLine
              key={i}
              x={minuteToLabel(g.minute)}
              stroke={g.team === "vonds" ? "rgb(34,197,94)" : "rgb(148,163,184)"}
              strokeWidth={2}
              strokeDasharray="4 2"
              label={<GoalLabel goal={g} />}
            />
          ))}

          <Line type="linear" dataKey="vPack" name="VONDS パッキング" stroke="rgb(34,197,94)" strokeWidth={2} dot={false}>
            <LabelList dataKey="vPack" content={(props) => {
              if (props.index !== lastIdx) return null
              return <EndLabel x={props.x as number} y={props.y as number} value={props.value as number} color="rgb(21,128,61)" />
            }} />
          </Line>
          <Line type="linear" dataKey="vImp" name="VONDS インペクト" stroke="rgba(34,197,94,0.5)" strokeWidth={1.5} dot={false} strokeDasharray="4 3">
            <LabelList dataKey="vImp" content={(props) => {
              if (props.index !== lastIdx) return null
              return <EndLabel x={props.x as number} y={props.y as number} value={props.value as number} color="rgb(21,128,61)" />
            }} />
          </Line>
          <Line type="linear" dataKey="oPack" name={`${opponent} パッキング`} stroke="rgb(148,163,184)" strokeWidth={2} dot={false}>
            <LabelList dataKey="oPack" content={(props) => {
              if (props.index !== lastIdx) return null
              return <EndLabel x={props.x as number} y={props.y as number} value={props.value as number} color="rgb(71,85,105)" />
            }} />
          </Line>
          <Line type="linear" dataKey="oImp" name={`${opponent} インペクト`} stroke="rgba(148,163,184,0.5)" strokeWidth={1.5} dot={false} strokeDasharray="4 3">
            <LabelList dataKey="oImp" content={(props) => {
              if (props.index !== lastIdx) return null
              return <EndLabel x={props.x as number} y={props.y as number} value={props.value as number} color="rgb(71,85,105)" />
            }} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PackingTimelineChart({ data, opponent }: { data: TimelineData; opponent: string }) {
  const tabs: HalfData[] = []
  if (data.total) tabs.push(data.total)
  if (data.halves) tabs.push(...data.halves)
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.label ?? '合計')

  if (tabs.length === 0) {
    if (data.labels && data.labels.length > 0 && data.vonds && data.opp) {
      const legacy: HalfData = { label: '合計', labels: data.labels, vonds: data.vonds, opp: data.opp }
      return <HalfChart half={legacy} opponent={opponent} />
    }
    return <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">データがありません</div>
  }

  const currentHalf = tabs.find(t => t.label === activeTab) ?? tabs[0]
  return (
    <div>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.label} onClick={() => setActiveTab(tab.label)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              activeTab === tab.label
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {currentHalf && <HalfChart half={currentHalf} opponent={opponent} />}
    </div>
  )
}
