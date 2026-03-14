import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Bot,
  ChevronDown,
  Clock,
  Maximize2,
  Target,
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
import { fetchReport } from "../api/reportpageApi";
import { mockReport} from "../types/reportMock"
import type { ReportResponse } from "../types/reportpageType";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_MODEL_CANDIDATES = ["gemini-2.5-flash", "models/gemini-2.5-flash"];

if (!API_KEY) {
  console.error(
    "VITE_GEMINI_API_KEY is missing. Check .env.local and restart dev server.",
  );
}

interface AnalysisReportPageProps {
  videoId: string;
  onBack: () => void;
  onJumpToVideo: (time: number) => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

type UiHeatmapZone = {
  x: number;
  y: number;
  intensity: number;
  time?: number;
};

type ExpandedPanel = "heatmap" | "stroke" | "ability" | "briefing" | null;

// ─── Collapsible card wrapper ────────────────────────────────────────────────
function CollapsibleCard({
  title,
  icon,
  onExpand,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onExpand: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header row */}
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

      {/* Collapsible body */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
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
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Badminton Heatmap Court (portrait / top-down) ───────────────────────────
//
//  BWF-standard court layout (top-down view):
//
//   ┌──────────────────────────────────────┐  ← outer doubles boundary (OT)
//   │                                      │  ← back alley (doubles only)
//   ├──────────────────────────────────────┤  ← back boundary line (BT)
//   │  │             │            │        │
//   │  │  TOP LEFT   │  TOP RIGHT │        │  ← centre service line runs BT→SST
//   │  │   SERVICE   │   SERVICE  │        │
//   │  ├─────────────┴────────────┤        │  ← short service line top (SST)
//   │  │                          │        │  ← mid-court: NO centre line here
//   │  ══════════════════════════════      │  ← NET (bold)
//   │  │                          │        │  ← mid-court: NO centre line here
//   │  ├─────────────┬────────────┤        │  ← short service line bottom (SSB)
//   │  │  BOT LEFT   │  BOT RIGHT │        │
//   │  │   SERVICE   │   SERVICE  │        │  ← centre service line runs SSB→BB
//   │  │             │            │        │
//   ├──────────────────────────────────────┤  ← back boundary line (BB)
//   │                                      │  ← back alley (doubles only)
//   └──────────────────────────────────────┘  ← outer doubles boundary (OB)
//
// viewBox 500 × 1100. Real ratio 6.1 m × 13.4 m → aspect ~1:2.197

const VW = 500;
const VH = 1100;

// Outer doubles boundary
const OL = 50;
const OR = 450;
const OT = 40;
const OB = 1060;
const OW = OR - OL;   // 400
const OH = OB - OT;   // 1020

// Singles sidelines inset (6.1 m total → 5.18 m singles → 0.46 m each side → 7.54%)
const SI = Math.round(OW * 0.0754);  // ≈ 30
const SL = OL + SI;   // 80
const SR = OR - SI;   // 420

// Back boundary lines (0.76 m from back edge / 13.4 m → 5.67%)
const BI = Math.round(OH * 0.0567);  // ≈ 58
const BT = OT + BI;   // 98
const BB = OB - BI;   // 1002

// Net (exact vertical centre)
const NY = OT + OH / 2;  // 550

// Short service lines (1.98 m from net / 13.4 m → 14.78%)
const SSO = Math.round(OH * 0.1478);  // ≈ 151
const SST = NY - SSO;   // 399
const SSB = NY + SSO;   // 701

// Centre service line x
const CX = (OL + OR) / 2;  // 250

function BadmintonHeatmapCourt({
  zones,
  selectedHeatmapPoint,
  setSelectedHeatmapPoint,
  onJumpToVideo,
  large = false,
}: {
  zones: UiHeatmapZone[];
  selectedHeatmapPoint: number | null;
  setSelectedHeatmapPoint: (index: number | null) => void;
  onJumpToVideo: (time: number) => void;
  large?: boolean;
}) {
  const LW = 2.5;
  const NW = 5;

  const courtSvg = (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%"   stopColor="#52954000" />
          <stop offset="100%" stopColor="#3d7230ff" />
        </linearGradient>
        <filter id="cs">
          <feDropShadow dx="0" dy="4" stdDeviation="7" floodOpacity="0.20" />
        </filter>
      </defs>

      {/* background */}
      <rect width={VW} height={VH} fill="#eef4f0" />

      {/* green court surface */}
      <rect x={OL} y={OT} width={OW} height={OH} fill="#4a8c39" filter="url(#cs)" rx="2" />
      {/* subtle highlight overlay */}
      <rect x={OL} y={OT} width={OW} height={OH} fill="url(#cg)" rx="2" opacity="0.35" />

      {/* ── Lines (all white) ── */}

      {/* 1 — outer doubles boundary */}
      <rect x={OL} y={OT} width={OW} height={OH} fill="none" stroke="#fff" strokeWidth={LW} rx="2" />

      {/* 2 — singles sidelines, full height */}
      <line x1={SL} y1={OT} x2={SL} y2={OB} stroke="#fff" strokeWidth={LW} />
      <line x1={SR} y1={OT} x2={SR} y2={OB} stroke="#fff" strokeWidth={LW} />

      {/* 3 — back boundary lines (doubles long service / back alley edge) */}
      <line x1={OL} y1={BT} x2={OR} y2={BT} stroke="#fff" strokeWidth={LW} />
      <line x1={OL} y1={BB} x2={OR} y2={BB} stroke="#fff" strokeWidth={LW} />

      {/* 4 — net */}
      <line x1={OL} y1={NY} x2={OR} y2={NY} stroke="#fff" strokeWidth={NW} />
      <circle cx={OL} cy={NY} r="5" fill="#fff" />
      <circle cx={OR} cy={NY} r="5" fill="#fff" />

      {/* 5 — short service lines (singles width only) */}
      <line x1={SL} y1={SST} x2={SR} y2={SST} stroke="#fff" strokeWidth={LW} />
      <line x1={SL} y1={SSB} x2={SR} y2={SSB} stroke="#fff" strokeWidth={LW} />

      {/* 6 — centre service line: back boundary ↔ short service line (top & bottom) */}
      {/*     ✅ CORRECT: centre line lives in the SERVICE BOX, NOT in mid-court        */}
      <line x1={CX} y1={BT}  x2={CX} y2={SST} stroke="#fff" strokeWidth={LW} />
      <line x1={CX} y1={SSB} x2={CX} y2={BB}  stroke="#fff" strokeWidth={LW} />

      {/* ── Heatmap dots ── */}
      {zones.map((zone, index) => {
        const px = OL + (zone.y / 100) * OW;
        const py = OT + (zone.x / 100) * OH;
        const r  = 15 + zone.intensity * 20;
        const sel = selectedHeatmapPoint === index;
        return (
          <g key={index} style={{ cursor: "pointer" }}
            onClick={() => {
              setSelectedHeatmapPoint(index);
              if (typeof zone.time === "number") onJumpToVideo(zone.time);
            }}
          >
            <circle cx={px} cy={py} r={r * 2.5} fill="rgba(239,68,68,0.06)" />
            <circle cx={px} cy={py} r={r * 1.6} fill="rgba(239,68,68,0.13)" />
            <circle cx={px} cy={py} r={r * 1.1} fill="rgba(239,68,68,0.28)" />
            <circle cx={px} cy={py} r={r}        fill="rgba(239,68,68,0.78)" />
            <circle cx={px} cy={py} r={r * 0.35} fill="rgba(255,255,255,0.55)" />
            {sel && <circle cx={px} cy={py} r={r + 9} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="5 3" />}
          </g>
        );
      })}

      {/* labels */}
      <text x={CX} y={OT - 14} textAnchor="middle" fontSize="15" fill="#94a3b8" fontWeight="600" letterSpacing="3">OPP</text>
      <text x={CX} y={OB + 24} textAnchor="middle" fontSize="15" fill="#64748b" fontWeight="700" letterSpacing="3">YOU</text>
    </svg>
  );

  if (large) {
    return (
      <div className="flex justify-center">
        <div className="relative overflow-visible rounded-xl shadow-xl"
          style={{ width: "min(300px, 100%)", aspectRatio: `${VW} / ${VH}` }}>
          {courtSvg}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 items-stretch">
      {/* Court */}
      <div className="relative shrink-0 overflow-visible"
        style={{ width: "min(175px, 36%)", aspectRatio: `${VW} / ${VH}` }}>
        {courtSvg}
      </div>

      {/* Info panel */}
      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
        <div>
          <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">포지션 분포</p>
          <div className="space-y-2.5">
            {[
              { label: "네트 앞",    pct: 28, color: "#ef4444" },
              { label: "미드 코트",  pct: 45, color: "#f97316" },
              { label: "백 바운더리 라인", pct: 27, color: "#3b82f6" },
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

        <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-3">
          <p className="text-[11px] font-semibold text-blue-700 mb-1">📍 히트 포인트</p>
          <p className="text-[11px] text-blue-500 leading-relaxed">
            {zones.length > 0
              ? `총 ${zones.length}개 위치 기록됨. 점 클릭 시 영상 해당 구간으로 이동합니다.`
              : "히트맵 데이터가 없습니다."}
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
    </div>
  );
}


// ─── Markdown briefing ───────────────────────────────────────────────────────
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


// ─── Main page ───────────────────────────────────────────────────────────────
export function AnalysisReportPage({
  videoId,
  onBack,
  onJumpToVideo,
  onNavigate,
  onLogout,
}: AnalysisReportPageProps) {
  const [selectedHeatmapPoint, setSelectedHeatmapPoint] = useState<number | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [aiBriefing, setAiBriefing] = useState<string>("");
  const [aiBriefingLoading, setAiBriefingLoading] = useState(false);
  const [aiBriefingError, setAiBriefingError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = mockReport //await fetchReport(videoId);
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

  useEffect(() => {
    if (!report) return;
    let alive = true;
    (async () => {
      try {
        setAiBriefingLoading(true);
        setAiBriefingError(null);

        if (!API_KEY) throw new Error("Gemini API Key가 없습니다. .env.local을 확인해주세요.");

        const summary = report.data.summary;
        const ability = report.data.abilityMetrics;
        const stroke = report.data.strokeTypes;
        const coaching = report.data.aiCoaching;

        const prompt = `
당신은 전문 배드민턴 코치입니다.
아래 경기 분석 데이터를 기반으로 'AI 브리핑' 형태의 리포트 요약을 작성하세요.

[경기 요약]
- 결과: ${summary.matchOutcome} (${summary.myScore} : ${summary.opponentScore})
- 경기 시간: ${summary.matchTime}
- 총 스트로크: ${summary.totalStrokeCount}

[능력치(0~100)]
- 스매시: ${ability.smash}
- 수비: ${ability.defense}
- 스피드: ${ability.speed}
- 지구력: ${ability.stamina}
- 정확도: ${ability.accuracy}

[스트로크 카운트]
- smash: ${stroke.smash}, clear: ${stroke.clear}, drop: ${stroke.drop}, drive: ${stroke.drive}

[기존 코치 피드백]
${coaching?.feedbackText ?? "(없음)"}

[출력 형식]
- 너무 길지 않게(모바일에서도 보기 좋게) 작성
- 아래 섹션을 반드시 포함:
1) 한 줄 총평
2) 핵심 지표 요약(불릿 3~5개)
3) 강점 TOP2
4) 보완점 TOP2
5) 추천 훈련 3가지(각각 1~2줄, 구체적으로)
- 마크다운 사용 가능(제목/불릿 정도)
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
        setAiBriefing(text || "");
      } catch (e: any) {
        if (!alive) return;
        setAiBriefingError(
          e?.message ?? "AI 브리핑 생성 중 오류가 발생했습니다. (API Key/모델명/권한 설정 확인)",
        );
        setAiBriefing("");
      } finally {
        if (!alive) return;
        setAiBriefingLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [report]);

  const ui = useMemo(() => {
    const data = report?.data;
    const summary = data?.summary;
    const position = data?.positionAnalysis;
    const strokeTypes = data?.strokeTypes;
    const ability = data?.abilityMetrics;

    const heatmapZones: UiHeatmapZone[] =
      position?.heatmapData?.map((p, idx) => ({
        x: p.x,
        y: p.y,
        intensity: p.value ?? 0.45 + (idx % 5) * 0.1,
    time: p.timeSec,
      })) ?? [];

    const strokeData = strokeTypes
      ? [
          { name: "스매시", count: strokeTypes.smash, color: "#ef4444" },
          { name: "클리어", count: strokeTypes.clear, color: "#3b82f6" },
          { name: "드롭",   count: strokeTypes.drop,  color: "#10b981" },
          { name: "드라이브", count: strokeTypes.drive, color: "#f59e0b" },
        ].filter((s) => typeof s.count === "number")
      : [];

    const abilityData = ability
      ? [
          { name: "스매시", value: ability.smash },
          { name: "수비",   value: ability.defense },
          { name: "스피드", value: ability.speed },
          { name: "지구력", value: ability.stamina },
          { name: "정확도", value: ability.accuracy },
        ]
      : [];

    return { summary, heatmapZones, strokeData, abilityData };
  }, [report]);

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header currentPage="report" onNavigate={onNavigate} onLogout={onLogout} hasSelectedVideo />
        <main className="container mx-auto max-w-6xl px-6 py-10">
          <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
            ← 돌아가기
          </button>
          <div className="rounded-xl border border-gray-100 p-8">
            <div className="text-sm font-semibold text-gray-700">리포트 불러오는 중...</div>
            <div className="mt-2 text-xs text-gray-400">잠시만 기다려줘.</div>
          </div>
        </main>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-white">
        <Header currentPage="report" onNavigate={onNavigate} onLogout={onLogout} hasSelectedVideo />
        <main className="container mx-auto max-w-6xl px-6 py-10">
          <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
            ← 돌아가기
          </button>
          <div className="rounded-xl border border-red-100 bg-red-50 p-8">
            <div className="text-sm font-bold text-red-700">리포트를 불러오지 못했습니다.</div>
            <div className="mt-2 text-xs text-red-600">{errorMsg}</div>
            <button onClick={() => window.location.reload()} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50">
              새로고침
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!report || !ui.summary) {
    return (
      <div className="min-h-screen bg-white">
        <Header currentPage="report" onNavigate={onNavigate} onLogout={onLogout} hasSelectedVideo />
        <main className="container mx-auto max-w-6xl px-6 py-10">
          <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
            ← 돌아가기
          </button>
          <div className="rounded-xl border border-gray-100 p-8">
            <div className="text-sm font-semibold text-gray-700">리포트 데이터가 비어있어</div>
            <div className="mt-2 text-xs text-gray-400">백엔드 응답을 확인해줘.</div>
          </div>
        </main>
      </div>
    );
  }

  const summary = ui.summary;

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="report" onNavigate={onNavigate} onLogout={onLogout} hasSelectedVideo />

      <main className="container mx-auto max-w-6xl px-6 py-10">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← 돌아가기
        </button>

        <div className="space-y-6">

          {/* ── Match Summary ── */}
          <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-gray-900">경기 결과 요약</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "바텀 플레이어 점수",    value: summary.myScore,          color: "text-blue-600",   icon: <Award className="size-4 text-blue-400" /> },
                { label: "탑 플레이어 점수",  value: summary.opponentScore,    color: "text-gray-700",   icon: <Award className="size-4 text-gray-400" /> },
                { label: "총 스트로크", value: `${summary.totalStrokeCount}회`, color: "text-purple-600", icon: <Zap className="size-4 text-purple-400" /> },
                { label: "경기 시간",  value: summary.matchTime,        color: "text-orange-600", icon: <Clock className="size-4 text-orange-400" /> },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="rounded-2xl border border-gray-50 bg-[#f8fafc] p-6 text-center">
                  <div className="mb-2 flex items-center justify-center gap-1.5">
                    {icon}
                    <span className="text-xs font-semibold text-gray-400">{label}</span>
                  </div>
                  <div className={`text-3xl font-bold ${color}`}>{value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Heatmap ── */}
          <CollapsibleCard
            title="히트맵"
            icon={<Target className="size-4 text-blue-600" />}
            onExpand={() => setExpandedPanel("heatmap")}
          >
            <BadmintonHeatmapCourt
              zones={ui.heatmapZones}
              selectedHeatmapPoint={selectedHeatmapPoint}
              setSelectedHeatmapPoint={setSelectedHeatmapPoint}
              onJumpToVideo={onJumpToVideo}
            />
          </CollapsibleCard>

          {/* ── Stroke + Ability side-by-side ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Stroke Types */}
            <CollapsibleCard
              title="스트로크 종류"
              icon={<Zap className="size-4 text-purple-600" />}
              onExpand={() => setExpandedPanel("stroke")}
            >
              <div className="mb-6 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ui.strokeData} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={38}>
                      {ui.strokeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5">
                {ui.strokeData.map((stroke) => (
                  <div key={stroke.name} className="flex items-center justify-between rounded-lg px-1">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stroke.color }} />
                      <span className="text-xs font-semibold text-gray-600">{stroke.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-500">{stroke.count}회</span>
                  </div>
                ))}
              </div>
            </CollapsibleCard>

            {/* Ability */}
            <CollapsibleCard
              title="능력치 분석"
              icon={<Award className="size-4 text-orange-500" />}
              onExpand={() => setExpandedPanel("ability")}
            >
              <div className="mb-4 flex h-[220px] items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={ui.abilityData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Radar name="능력치" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.45} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 px-1">
                {ui.abilityData.map((ability) => (
                  <div key={ability.name} className="flex items-center justify-between border-b border-gray-50 py-1">
                    <span className="text-xs font-semibold text-gray-500">{ability.name}</span>
                    <span className="text-xs font-bold text-blue-600">{ability.value}점</span>
                  </div>
                ))}
              </div>
            </CollapsibleCard>
          </div>

          {/* ── AI Briefing ── */}
          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Bot className="size-4 text-blue-600" />
                AI 브리핑
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

            {/* Body */}
            <div className="p-6">
                {aiBriefingLoading && (
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm text-blue-600 font-medium">AI가 리포트를 요약 중입니다...</span>
                  </div>
                )}

                {aiBriefingError && (
                  <div className="text-sm text-red-600">
                    브리핑 생성 실패: {aiBriefingError}
                  </div>
                )}

                {!aiBriefingLoading && !aiBriefingError && (
                  <MarkdownBriefing content={aiBriefing} />
                )}

                <p className="mt-4 text-[11px] text-gray-400">
                  * 이 브리핑은 경기 분석 데이터를 기반으로 자동 생성됩니다.
                </p>
            </div>
          </section>

        </div>
      </main>

      {/* ── Modals ── */}
      <Modal open={expandedPanel === "heatmap"} title="히트맵 상세 보기" onClose={() => setExpandedPanel(null)}>
        <p className="mb-5 text-sm text-gray-500">배드민턴 코트 기준 위치 데이터를 시각화한 히트맵입니다.</p>
        <BadmintonHeatmapCourt
          zones={ui.heatmapZones}
          selectedHeatmapPoint={selectedHeatmapPoint}
          setSelectedHeatmapPoint={setSelectedHeatmapPoint}
          onJumpToVideo={onJumpToVideo}
          large
        />
      </Modal>

      <Modal open={expandedPanel === "stroke"} title="스트로크 종류 상세 보기" onClose={() => setExpandedPanel(null)}>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ui.strokeData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid vertical={false} stroke="#e5edf5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#64748b" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60}>
                {ui.strokeData.map((entry, index) => (
                  <Cell key={`expanded-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Modal>

      <Modal open={expandedPanel === "ability"} title="능력치 분석 상세 보기" onClose={() => setExpandedPanel(null)}>
        <div className="h-[480px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={ui.abilityData}>
              <PolarGrid stroke="#e5edf5" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 13, fill: "#64748b" }} />
              <Radar name="능력치" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.45} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Modal>

      <Modal open={expandedPanel === "briefing"} title="AI 브리핑 상세 보기" onClose={() => setExpandedPanel(null)}>
        {aiBriefingLoading && (
          <div className="text-sm text-blue-600 animate-pulse">AI가 리포트를 요약 중입니다...</div>
        )}
        {aiBriefingError && (
          <div className="text-sm text-red-600">브리핑 생성 실패: {aiBriefingError}</div>
        )}
        {!aiBriefingLoading && !aiBriefingError && (
          <MarkdownBriefing content={aiBriefing} />
        )}
      </Modal>
    </div>
  );
}
