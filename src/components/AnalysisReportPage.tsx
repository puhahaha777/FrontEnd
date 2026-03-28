import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutDashboard,
  LogOut,
  Maximize2,
  Play,
  Target,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import ReactMarkdown from "react-markdown";

import { Header, type Page } from "./Header";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { mockReport } from "../types/reportMock";
import type {
  ReportResponse,
  PlayerKey,
  HeatmapPoint,
} from "../types/reportpageType";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_MODEL_CANDIDATES = ["gemini-2.5-flash", "models/gemini-2.5-flash"];

// ─────────────────────────────────────────────────────────────────────────────
// Types / Props
// ─────────────────────────────────────────────────────────────────────────────

interface UserInfo {
  nickname?: string;
  email?: string;
  avatarUrl?: string;
}

interface AnalysisReportPageProps {
  videoId: string;
  onBack: () => void;
  onJumpToVideo: (time: number) => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user?: UserInfo;
}

type UiHeatmapZone = {
  x: number;
  y: number;
  intensity: number;
  time?: number;
};

type ExpandedPanel = "heatmap" | "stroke" | "ability" | "briefing" | null;

// 사이드바 섹션 ID
type SidebarSectionId = "summary" | "heatmap" | "stroke" | "ability" | "briefing";

// ─────────────────────────────────────────────────────────────────────────────
// Player Toggle
// ─────────────────────────────────────────────────────────────────────────────

const PLAYERS: { key: PlayerKey; label: string }[] = [
  { key: "bottom", label: "Bottom Player" },
  { key: "top", label: "Top Player" },
];

function PlayerToggle({
  active,
  onChange,
}: {
  active: PlayerKey;
  onChange: (k: PlayerKey) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1">
      {PLAYERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
            ${
              active === key
                ? key === "bottom"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "text-gray-500 hover:text-gray-800"
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible card
// ─────────────────────────────────────────────────────────────────────────────

function CollapsibleCard({
  title,
  icon,
  onExpand,
  defaultOpen = true,
  children,
  sectionId,
}: {
  title: string;
  icon: React.ReactNode;
  onExpand: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
  sectionId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      id={sectionId}
      className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden scroll-mt-6"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left flex-1 group"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {icon}
            {title}
          </span>
          <ChevronDown
            className={`size-4 text-gray-400 ml-1 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors shrink-0 ml-3"
        >
          <Maximize2 className="size-3" />
          확대
        </button>
      </div>
      <div
        className={`transition-all duration-300 ease-in-out ${
          open
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="닫기"
      />
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Badminton Heatmap Court
// ─────────────────────────────────────────────────────────────────────────────

const VW = 500;
const VH = 1100;
const OL = 50, OR = 450, OT = 40, OB = 1060;
const OW = OR - OL, OH = OB - OT;
const SI = Math.round(OW * 0.0754);
const SL = OL + SI, SR = OR - SI;
const BI = Math.round(OH * 0.0567);
const BT = OT + BI, BB = OB - BI;
const NY = OT + OH / 2;
const SSO = Math.round(OH * 0.1478);
const SST = NY - SSO, SSB = NY + SSO;
const CX = (OL + OR) / 2;

function BadmintonHeatmapCourt({
  zones,
  selectedHeatmapPoint,
  setSelectedHeatmapPoint,
  onJumpToVideo,
  playerKey,
  large = false,
}: {
  zones: UiHeatmapZone[];
  selectedHeatmapPoint: number | null;
  setSelectedHeatmapPoint: (i: number | null) => void;
  onJumpToVideo: (t: number) => void;
  playerKey: PlayerKey;
  large?: boolean;
}) {
  const LW = 2.5;
  const NW = 5;
  const isBottom = playerKey === "bottom";
  const accentColor = isBottom ? "#3b82f6" : "#6366f1";

  const courtSvg = (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#52954000" />
          <stop offset="100%" stopColor="#3d7230ff" />
        </linearGradient>
        <filter id="cs">
          <feDropShadow dx="0" dy="4" stdDeviation="7" floodOpacity="0.20" />
        </filter>
        <linearGradient id="highlight-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.08" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="highlight-bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect width={VW} height={VH} fill="#eef4f0" />
      <rect x={OL} y={OT} width={OW} height={OH} fill="#4a8c39" filter="url(#cs)" rx="2" />
      <rect x={OL} y={OT} width={OW} height={OH} fill="url(#cg)" rx="2" opacity="0.35" />
      {isBottom ? (
        <rect x={OL} y={NY} width={OW} height={OH / 2} fill={`url(#highlight-bottom)`} />
      ) : (
        <rect x={OL} y={OT} width={OW} height={OH / 2} fill={`url(#highlight-top)`} />
      )}
      <rect x={OL} y={OT} width={OW} height={OH} fill="none" stroke="#fff" strokeWidth={LW} rx="2" />
      <line x1={SL} y1={OT} x2={SL} y2={OB} stroke="#fff" strokeWidth={LW} />
      <line x1={SR} y1={OT} x2={SR} y2={OB} stroke="#fff" strokeWidth={LW} />
      <line x1={OL} y1={BT} x2={OR} y2={BT} stroke="#fff" strokeWidth={LW} />
      <line x1={OL} y1={BB} x2={OR} y2={BB} stroke="#fff" strokeWidth={LW} />
      <line x1={OL} y1={NY} x2={OR} y2={NY} stroke="#fff" strokeWidth={NW} />
      <circle cx={OL} cy={NY} r="5" fill="#fff" />
      <circle cx={OR} cy={NY} r="5" fill="#fff" />
      <line x1={SL} y1={SST} x2={SR} y2={SST} stroke="#fff" strokeWidth={LW} />
      <line x1={SL} y1={SSB} x2={SR} y2={SSB} stroke="#fff" strokeWidth={LW} />
      <line x1={CX} y1={BT} x2={CX} y2={SST} stroke="#fff" strokeWidth={LW} />
      <line x1={CX} y1={SSB} x2={CX} y2={BB} stroke="#fff" strokeWidth={LW} />
      {zones.map((zone, index) => {
        const px = OL + (zone.x / 100) * OW;
        const py = OT + (zone.y / 100) * OH;
        const r = 15 + zone.intensity * 20;
        const sel = selectedHeatmapPoint === index;
        return (
          <g key={index} style={{ cursor: "pointer" }} onClick={() => {
            setSelectedHeatmapPoint(index);
            if (typeof zone.time === "number") onJumpToVideo(zone.time);
          }}>
            <circle cx={px} cy={py} r={r * 2.5} fill="rgba(239,68,68,0.06)" />
            <circle cx={px} cy={py} r={r * 1.6} fill="rgba(239,68,68,0.13)" />
            <circle cx={px} cy={py} r={r * 1.1} fill="rgba(239,68,68,0.28)" />
            <circle cx={px} cy={py} r={r} fill="rgba(239,68,68,0.78)" />
            <circle cx={px} cy={py} r={r * 0.35} fill="rgba(255,255,255,0.55)" />
            {sel && (
              <circle cx={px} cy={py} r={r + 9} fill="none" stroke={accentColor} strokeWidth="2.5" strokeDasharray="5 3" />
            )}
          </g>
        );
      })}
      <text x={CX} y={OT - 14} textAnchor="middle" fontSize="15" fill="#94a3b8" fontWeight="600" letterSpacing="3">TOP</text>
      <text x={CX} y={OB + 24} textAnchor="middle" fontSize="15" fill="#64748b" fontWeight="700" letterSpacing="3">BOTTOM</text>
      {isBottom ? (
        <text x={CX} y={OB + 44} textAnchor="middle" fontSize="12" fill={accentColor} fontWeight="700">▲ 선택됨</text>
      ) : (
        <text x={CX} y={OT - 28} textAnchor="middle" fontSize="12" fill={accentColor} fontWeight="700">선택됨 ▼</text>
      )}
    </svg>
  );

  const infoPanel = (
    <div className="flex flex-col justify-between py-1 min-w-0">
      <div>
        <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">포지션 분포</p>
        <div className="space-y-2.5">
          {[
            { label: "네트 앞", pct: 28, color: "#ef4444" },
            { label: "미드 코트", pct: 45, color: "#f97316" },
            { label: "백 바운더리", pct: 27, color: "#3b82f6" },
          ].map(({ label, pct, color }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] font-medium text-gray-500">{label}</span>
                <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{pct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl p-3" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}30` }}>
        <p className="text-[11px] font-semibold mb-1" style={{ color: accentColor }}>📍 히트 포인트</p>
        <p className="text-[11px] leading-relaxed" style={{ color: accentColor }}>
          {zones.length > 0 ? `총 ${zones.length}개 위치 기록됨. 점 클릭 시 영상 해당 구간으로 이동합니다.` : "히트맵 데이터가 없습니다."}
        </p>
      </div>
      <div className="mt-3 flex gap-3 flex-wrap">
        {[
          { label: "고빈도", color: "rgba(239,68,68,0.78)" },
          { label: "중빈도", color: "rgba(239,68,68,0.42)" },
          { label: "저빈도", color: "rgba(239,68,68,0.18)" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-gray-400 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (large) {
    return (
      <div className="flex justify-center">
        <div className="relative overflow-visible rounded-xl shadow-xl" style={{ width: "min(300px, 100%)", aspectRatio: `${VW} / ${VH}` }}>
          {courtSvg}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 items-stretch">
      <div className="relative shrink-0 overflow-visible" style={{ width: "min(175px, 36%)", aspectRatio: `${VW} / ${VH}` }}>
        {courtSvg}
      </div>
      <div className="flex-1">{infoPanel}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Heatmap zone factory
// ─────────────────────────────────────────────────────────────────────────────

function buildZones(points: HeatmapPoint[]): UiHeatmapZone[] {
  return points.map((p) => ({ x: p.x, y: p.y, intensity: p.value ?? 0.5, time: p.timeSec }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown briefing
// ─────────────────────────────────────────────────────────────────────────────

function MarkdownBriefing({ content }: { content: string }) {
  if (!content) return <p className="text-sm text-gray-400">AI 브리핑 데이터가 없습니다.</p>;
  return (
    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed
      [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-1
      [&_h2]:text-sm  [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1
      [&_h3]:text-sm  [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-0.5
      [&_p]:mb-2 [&_p]:text-gray-700
      [&_ul]:mb-2 [&_ul]:pl-4
      [&_li]:list-disc [&_li]:mb-0.5 [&_li]:text-gray-700
      [&_strong]:font-semibold [&_strong]:text-blue-700">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grade system
// ─────────────────────────────────────────────────────────────────────────────

const GRADE_THRESHOLDS: { min: number; grade: string; color: string; bg: string }[] = [
  { min: 97, grade: "A+", color: "#059669", bg: "#d1fae5" },
  { min: 93, grade: "A", color: "#059669", bg: "#d1fae5" },
  { min: 90, grade: "A−", color: "#059669", bg: "#d1fae5" },
  { min: 87, grade: "B+", color: "#2563eb", bg: "#dbeafe" },
  { min: 83, grade: "B", color: "#2563eb", bg: "#dbeafe" },
  { min: 80, grade: "B−", color: "#2563eb", bg: "#dbeafe" },
  { min: 77, grade: "C+", color: "#7c3aed", bg: "#ede9fe" },
  { min: 73, grade: "C", color: "#7c3aed", bg: "#ede9fe" },
  { min: 70, grade: "C−", color: "#7c3aed", bg: "#ede9fe" },
  { min: 67, grade: "D+", color: "#d97706", bg: "#fef3c7" },
  { min: 63, grade: "D", color: "#d97706", bg: "#fef3c7" },
  { min: 60, grade: "D−", color: "#d97706", bg: "#fef3c7" },
  { min: 0, grade: "E", color: "#dc2626", bg: "#fee2e2" },
];

function scoreToGrade(value: number): { grade: string; color: string; bg: string } {
  for (const t of GRADE_THRESHOLDS) {
    if (value >= t.min) return { grade: t.grade, color: t.color, bg: t.bg };
  }
  return { grade: "E", color: "#dc2626", bg: "#fee2e2" };
}

function scoreToBarPct(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

function AbilityGradeRow({ label, value, accentColor }: { label: string; value: number; accentColor: string }) {
  const { grade, color, bg } = scoreToGrade(value);
  const pct = scoreToBarPct(value);
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
      <span className="shrink-0 w-8 text-center text-xs font-black py-0.5 rounded-md" style={{ color, background: bg }}>{grade}</span>
      <span className="shrink-0 w-12 text-xs font-semibold text-gray-600">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accentColor }} />
      </div>
      <span className="shrink-0 w-8 text-right text-[10px] tabular-nums text-gray-400 font-medium">{value}</span>
    </div>
  );
}

function AbilityGradeCard({ label, value, accentColor }: { label: string; value: number; accentColor: string }) {
  const { grade, color, bg } = scoreToGrade(value);
  const pct = scoreToBarPct(value);
  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <span className="text-xs font-black px-2 py-0.5 rounded-md min-w-[32px] text-center" style={{ color, background: bg }}>{grade}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: accentColor }} />
      </div>
      <span className="text-[10px] tabular-nums text-gray-400 self-end">{value} / 100</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function AnalysisReportPage({
  videoId,
  onBack,
  onJumpToVideo,
  onNavigate,
  onLogout,
  user,
}: AnalysisReportPageProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedHeatmapPoint, setSelectedHeatmapPoint] = useState<number | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);
  const [activePlayer, setActivePlayer] = useState<PlayerKey>("bottom");

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [briefings, setBriefings] = useState<Record<PlayerKey, string>>({ top: "", bottom: "" });
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  // 사이드바
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 섹션 refs (스크롤용)
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs: Record<SidebarSectionId, React.RefObject<HTMLDivElement | null>> = {
    summary: useRef<HTMLDivElement>(null),
    heatmap: useRef<HTMLDivElement>(null),
    stroke: useRef<HTMLDivElement>(null),
    ability: useRef<HTMLDivElement>(null),
    briefing: useRef<HTMLDivElement>(null),
  };

  const scrollToSection = (id: SidebarSectionId) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ── Fetch report ──────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = mockReport;
        if (!alive) return;
        setReport(res);
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message ?? "리포트를 불러오지 못했습니다.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [videoId]);

  // ── Generate AI briefing ──────────────────────────────────────────────────
  useEffect(() => {
    if (!report) return;
    if (briefings[activePlayer]) return;

    let alive = true;
    (async () => {
      try {
        setBriefingLoading(true);
        setBriefingError(null);

        if (!API_KEY) throw new Error("Gemini API Key가 없습니다.");

        const playerData = report.data.players[activePlayer];
        const ability = playerData.abilityMetrics;
        const stroke = playerData.strokeTypes;
        const summary = report.data.summary;
        const coaching = playerData.aiCoaching;
        const playerLabel = activePlayer === "bottom" ? "Bottom Player" : "Top Player";
        const playerStrokeTotal = stroke.smash + stroke.clear + stroke.drop + stroke.drive;

        const prompt = `
당신은 전문 배드민턴 코치입니다.
아래 데이터는 경기 영상에서 분석한 [${playerLabel}] 개인의 데이터입니다.

[경기 전체 개요 — 참고용, 개인 수치 아님]
- 경기 결과(Bottom 기준): ${summary.matchOutcome} (Bottom ${summary.myScore} : Top ${summary.opponentScore})
- 총 경기 시간: ${summary.matchTime}
- 양측 합산 총 스트로크: ${summary.totalStrokeCount}회

[${playerLabel} 개인 스트로크]
- 개인 스트로크 합계: ${playerStrokeTotal}회
- Smash: ${stroke.smash}회, Clear: ${stroke.clear}회, Drop: ${stroke.drop}회, Drive: ${stroke.drive}회

[${playerLabel} 능력치 (0~100)]
- 스매시: ${ability.smash} / 수비: ${ability.defense} / 스피드: ${ability.speed}
- 지구력: ${ability.stamina} / 정확도: ${ability.accuracy}

[기존 코치 피드백]
${coaching?.feedbackText ?? "(없음)"}

[출력 형식]
- 간결하게 (모바일 친화적)
- 섹션: ① 한 줄 총평 ② 핵심 지표 요약(불릿 3~5개) ③ 강점 TOP2 ④ 보완점 TOP2 ⑤ 추천 훈련 3가지
- 마크다운 사용 가능
        `.trim();

        const genAI = new GoogleGenerativeAI(API_KEY);
        let text = "";
        let lastErr: any = null;

        for (const modelName of GEMINI_MODEL_CANDIDATES) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            text = result.response.text();
            lastErr = null;
            break;
          } catch (err: any) {
            lastErr = err;
          }
        }

        if (lastErr) throw lastErr;
        if (!alive) return;
        setBriefings((prev) => ({ ...prev, [activePlayer]: text || "" }));
      } catch (e: any) {
        if (!alive) return;
        setBriefingError(e?.message ?? "AI 브리핑 생성 중 오류가 발생했습니다.");
      } finally {
        if (!alive) return;
        setBriefingLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, activePlayer]);

  // ── Derived UI data ───────────────────────────────────────────────────────
  const ui = useMemo(() => {
    if (!report) return null;
    const summary = report.data.summary;
    const playerData = report.data.players[activePlayer];
    const heatmapZones = buildZones(playerData.positionAnalysis.heatmapData);
    const strokeData = [
      { name: "스매시", count: playerData.strokeTypes.smash, color: "#ef4444" },
      { name: "클리어", count: playerData.strokeTypes.clear, color: "#3b82f6" },
      { name: "드롭", count: playerData.strokeTypes.drop, color: "#10b981" },
      { name: "드라이브", count: playerData.strokeTypes.drive, color: "#f59e0b" },
    ];
    const abilityData = [
      { name: "스매시", value: playerData.abilityMetrics.smash },
      { name: "수비", value: playerData.abilityMetrics.defense },
      { name: "스피드", value: playerData.abilityMetrics.speed },
      { name: "지구력", value: playerData.abilityMetrics.stamina },
      { name: "정확도", value: playerData.abilityMetrics.accuracy },
    ];
    const accentColor = activePlayer === "bottom" ? "#3b82f6" : "#6366f1";
    return { summary, heatmapZones, strokeData, abilityData, accentColor };
  }, [report, activePlayer]);

  useEffect(() => { setSelectedHeatmapPoint(null); }, [activePlayer]);

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header currentPage="report" onNavigate={onNavigate} onLogout={onLogout} hasSelectedVideo user={user} />
        <main className="container mx-auto max-w-6xl px-6 py-10">
          <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
            ← 돌아가기
          </button>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium">리포트 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-white">
        <Header currentPage="report" onNavigate={onNavigate} onLogout={onLogout} hasSelectedVideo user={user} />
        <main className="container mx-auto max-w-6xl px-6 py-10">
          <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
            ← 돌아가기
          </button>
          <div className="rounded-xl border border-red-100 bg-red-50 p-8">
            <p className="text-sm font-bold text-red-700">리포트를 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs text-red-600">{errorMsg}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50">
              새로고침
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!report || !ui) return null;

  const { summary, heatmapZones, strokeData, abilityData, accentColor } = ui;
  const aiBriefing = briefings[activePlayer];
  const isBottom = activePlayer === "bottom";

  // 사이드바 섹션 목록
  const sidebarSections: { id: SidebarSectionId; label: string; icon: React.ReactNode }[] = [
    { id: "summary", label: "경기 결과", icon: <Users className="size-4 shrink-0" /> },
    { id: "heatmap", label: "히트맵", icon: <Target className="size-4 shrink-0" style={{ color: accentColor }} /> },
    { id: "stroke", label: "스트로크 분포", icon: <Zap className="size-4 shrink-0 text-purple-500" /> },
    { id: "ability", label: "능력치 분석", icon: <Award className="size-4 shrink-0 text-orange-500" /> },
    { id: "briefing", label: "AI 브리핑", icon: <Bot className="size-4 shrink-0 text-blue-600" /> },
  ];

  // 사이드바 nav 목록
  const navItems = [
    { id: "dashboard" as Page, label: "대시보드", icon: <LayoutDashboard className="size-4 shrink-0" />, action: () => onNavigate("dashboard") },
    { id: "video" as Page, label: "영상 보기", icon: <Play className="size-4 shrink-0" />, action: () => onNavigate("video") },
    { id: "account" as Page, label: "계정 관리", icon: <User className="size-4 shrink-0" />, action: () => onNavigate("account") },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentPage="report" onNavigate={onNavigate} onLogout={onLogout} hasSelectedVideo user={user} />

      <div className="flex flex-1 overflow-hidden">
        {/* ══════════════════════════════════════════════════════
            사이드바
           ══════════════════════════════════════════════════════ */}
        <aside
          className={`
            relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shrink-0
            ${sidebarOpen ? "w-60" : "w-14"}
          `}
          style={{ minHeight: "calc(100vh - 64px)" }}
        >
          {/* 토글 버튼 */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="absolute -right-3 top-6 z-10 flex items-center justify-center w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow text-gray-500 hover:text-gray-700"
          >
            {sidebarOpen ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>

          <div className="flex flex-col h-full overflow-hidden">
            {/* 네비게이션 */}
            <div className={`px-3 pt-5 pb-3 border-b border-gray-100 ${sidebarOpen ? "" : "px-2"}`}>
              {sidebarOpen && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">네비게이션</p>
              )}
              <div className="space-y-0.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    {item.icon}
                    {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 섹션 이동 */}
            <div className={`px-3 pt-4 pb-3 flex-1 overflow-y-auto ${sidebarOpen ? "" : "px-2"}`}>
              {sidebarOpen && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">분석 섹션</p>
              )}
              <div className="space-y-0.5">
                {sidebarSections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => {
                      if (!sidebarOpen) setSidebarOpen(true);
                      scrollToSection(sec.id);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-lg transition-colors text-left text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
                    title={!sidebarOpen ? sec.label : undefined}
                  >
                    {sec.icon}
                    {sidebarOpen && <span className="text-sm font-medium truncate">{sec.label}</span>}
                  </button>
                ))}
              </div>

              {/* 플레이어 선택 (사이드바 열렸을 때만) */}
              {sidebarOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">플레이어</p>
                  <PlayerToggle active={activePlayer} onChange={(k) => setActivePlayer(k)} />
                </div>
              )}
            </div>

            {/* 로그아웃 */}
            <div className={`border-t border-gray-100 p-3 ${sidebarOpen ? "" : "px-2"}`}>
              <button
                onClick={onLogout}
                className={`w-full flex items-center gap-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ${sidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"}`}
                title={!sidebarOpen ? "로그아웃" : undefined}
              >
                <LogOut className="size-4 shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">로그아웃</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════
            메인 콘텐츠
           ══════════════════════════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto" ref={mainScrollRef}>
          <div className="max-w-5xl mx-auto px-6 py-10">
            {/* Back */}
            <button
              onClick={onBack}
              className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
            >
              ← 돌아가기
            </button>

            <div className="space-y-6">
              {/* ── 1. Match Summary ── */}
              <section id="section-summary" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm scroll-mt-6">
                <div className="flex items-center gap-2 mb-5">
                  <Users className="size-4 text-gray-500" />
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">경기 결과 요약</h2>
                </div>

                <div className="flex items-center justify-center gap-6 mb-6 py-4 rounded-xl bg-gray-50">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Bottom</span>
                    <span className="text-5xl font-black text-gray-900 tabular-nums">{summary.myScore}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-light text-gray-300 mt-1">VS</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Top</span>
                    <span className="text-5xl font-black text-gray-900 tabular-nums">{summary.opponentScore}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <Zap className="size-4 text-purple-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">양측 합산 스트로크</p>
                      <p className="text-lg font-black text-purple-600">{summary.totalStrokeCount}회</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <Clock className="size-4 text-orange-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">경기 시간</p>
                      <p className="text-lg font-black text-orange-600">{summary.matchTime}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 2. Player indicator ── */}
              <div
                className="flex items-center justify-end"
                style={{
                  background: `${accentColor}10`,
                  borderRadius: "12px",
                  padding: "8px 16px",
                  border: `1px solid ${accentColor}30`,
                }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: accentColor }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
                  {isBottom ? "Bottom Player 분석 중" : "Top Player 분석 중"}
                </div>
              </div>

              {/* ── 3. Heatmap ── */}
              <div id="section-heatmap" className="scroll-mt-6">
                <CollapsibleCard
                  title="히트맵"
                  icon={<Target className="size-4" style={{ color: accentColor }} />}
                  onExpand={() => setExpandedPanel("heatmap")}
                >
                  <BadmintonHeatmapCourt
                    zones={heatmapZones}
                    selectedHeatmapPoint={selectedHeatmapPoint}
                    setSelectedHeatmapPoint={setSelectedHeatmapPoint}
                    onJumpToVideo={onJumpToVideo}
                    playerKey={activePlayer}
                  />
                </CollapsibleCard>
              </div>

              {/* ── 4. Stroke + Ability ── */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div id="section-stroke" className="scroll-mt-6">
                  <CollapsibleCard
                    title="스트로크 분포"
                    icon={<Zap className="size-4 text-purple-500" />}
                    onExpand={() => setExpandedPanel("stroke")}
                  >
                    <div className="mb-3 h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={strokeData} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
                          <CartesianGrid vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={36}>
                            {strokeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {strokeData.map((stroke) => (
                        <div key={stroke.name} className="flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stroke.color }} />
                            <span className="text-xs font-semibold text-gray-600">{stroke.name}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-500">{stroke.count}회</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleCard>
                </div>

                <div id="section-ability" className="scroll-mt-6">
                  <CollapsibleCard
                    title="능력치 분석"
                    icon={<Award className="size-4 text-orange-500" />}
                    onExpand={() => setExpandedPanel("ability")}
                  >
                    <div className="mb-3 h-[200px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={abilityData}>
                          <PolarGrid stroke="#f1f5f9" />
                          <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                          <Radar name="능력치" dataKey="value" stroke={accentColor} fill={accentColor} fillOpacity={0.35} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col divide-y divide-gray-50">
                      {abilityData.map((a) => (
                        <AbilityGradeRow key={a.name} label={a.name} value={a.value} accentColor={accentColor} />
                      ))}
                    </div>
                  </CollapsibleCard>
                </div>
              </div>

              {/* ── 5. AI Briefing ── */}
              <section id="section-briefing" className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden scroll-mt-6">
                <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Bot className="size-4 text-blue-600" />
                    AI 브리핑
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${accentColor}15`, color: accentColor }}>
                      {isBottom ? "Bottom Player" : "Top Player"}
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setExpandedPanel("briefing")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <Maximize2 className="size-3" />
                    확대
                  </button>
                </div>
                <div className="p-6">
                  {briefingLoading && (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[0, 150, 300].map((delay) => (
                          <span key={delay} className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: `${delay}ms` }} />
                        ))}
                      </div>
                      <span className="text-sm font-medium" style={{ color: accentColor }}>AI가 리포트를 요약 중입니다...</span>
                    </div>
                  )}
                  {briefingError && <p className="text-sm text-red-600">브리핑 생성 실패: {briefingError}</p>}
                  {!briefingLoading && !briefingError && <MarkdownBriefing content={aiBriefing} />}
                  <p className="mt-4 text-[11px] text-gray-400">* 이 브리핑은 경기 분석 데이터를 기반으로 자동 생성됩니다.</p>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      <Modal open={expandedPanel === "heatmap"} title="히트맵 상세 보기" onClose={() => setExpandedPanel(null)}>
        <p className="mb-5 text-sm text-gray-500">
          {isBottom ? "Bottom Player" : "Top Player"}의 코트 포지션 히트맵입니다.
        </p>
        <BadmintonHeatmapCourt zones={heatmapZones} selectedHeatmapPoint={selectedHeatmapPoint} setSelectedHeatmapPoint={setSelectedHeatmapPoint} onJumpToVideo={onJumpToVideo} playerKey={activePlayer} large />
      </Modal>

      <Modal open={expandedPanel === "stroke"} title="스트로크 분포 상세" onClose={() => setExpandedPanel(null)}>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strokeData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid vertical={false} stroke="#e5edf5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#64748b" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: 10 }} />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60}>
                {strokeData.map((entry, index) => (
                  <Cell key={`exp-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Modal>

      <Modal open={expandedPanel === "ability"} title="능력치 분석 상세" onClose={() => setExpandedPanel(null)}>
        <div className="h-[320px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={abilityData}>
              <PolarGrid stroke="#e5edf5" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 13, fill: "#64748b" }} />
              <Radar name="능력치" dataKey="value" stroke={accentColor} fill={accentColor} fillOpacity={0.4} />
              <Tooltip contentStyle={{ borderRadius: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {abilityData.map((a) => (
            <AbilityGradeCard key={a.name} label={a.name} value={a.value} accentColor={accentColor} />
          ))}
        </div>
      </Modal>

      <Modal open={expandedPanel === "briefing"} title="AI 브리핑 상세" onClose={() => setExpandedPanel(null)}>
        {briefingLoading && <p className="text-sm animate-pulse" style={{ color: accentColor }}>AI가 리포트를 요약 중입니다...</p>}
        {briefingError && <p className="text-sm text-red-600">브리핑 생성 실패: {briefingError}</p>}
        {!briefingLoading && !briefingError && <MarkdownBriefing content={aiBriefing} />}
      </Modal>
    </div>
  );
}