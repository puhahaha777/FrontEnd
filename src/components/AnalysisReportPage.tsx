import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Bot,
  Clock,
  ScatterChart as ScatterIcon,
  Target,
  Zap,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

import { Header, type Page } from "./Header";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ env에서 키 읽기 (Vite는 VITE_ prefix 필수)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// ✅ 모델 후보(환경에 따라 "models/" prefix가 필요할 때가 있어 fallback)
const GEMINI_MODEL_CANDIDATES = ["gemini-2.5-flash", "models/gemini-2.5-flash"];

if (!API_KEY) {
  console.error(
    "VITE_GEMINI_API_KEY is missing. Check .env.local and restart dev server.",
  );
}

// API에서 받아오는 데이터 형태에 맞춰 타입 정의
import { fetchReport } from "../api/reportpageApi";
import type { ReportResponse } from "../types/reportpageType";

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

export function AnalysisReportPage({
  videoId,
  onBack,
  onJumpToVideo,
  onNavigate,
  onLogout,
}: AnalysisReportPageProps) {
  const [selectedHeatmapPoint, setSelectedHeatmapPoint] = useState<number | null>(
    null,
  );

  // ---- 데이터 로딩 ----
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---- AI 브리핑 ----
  const [aiBriefing, setAiBriefing] = useState<string>("");
  const [aiBriefingLoading, setAiBriefingLoading] = useState(false);
  const [aiBriefingError, setAiBriefingError] = useState<string | null>(null);

  // ✅ 리포트 fetch
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetchReport(videoId);
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

    return () => {
      alive = false;
    };
  }, [videoId]);

  // ✅ AI 브리핑 생성 (report 로드된 뒤 1회)
  useEffect(() => {
    if (!report) return;

    let alive = true;

    (async () => {
      try {
        setAiBriefingLoading(true);
        setAiBriefingError(null);

        if (!API_KEY) {
          throw new Error("Gemini API Key가 없습니다. .env.local을 확인해주세요.");
        }

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

        // ✅ 모델명 404 방지용 fallback 시도
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

        if (lastErr) {
          throw lastErr;
        }

        if (!alive) return;
        setAiBriefing(text || "");
      } catch (e: any) {
        if (!alive) return;
        setAiBriefingError(
          e?.message ??
            "AI 브리핑 생성 중 오류가 발생했습니다. (API Key/모델명/권한 설정 확인)",
        );
        setAiBriefing("");
      } finally {
        if (!alive) return;
        setAiBriefingLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [report]);

  // 데이터 매핑
  const ui = useMemo(() => {
    const data = report?.data;

    const summary = data?.summary;
    const position = data?.positionAnalysis;
    const strokeTypes = data?.strokeTypes;
    const ability = data?.abilityMetrics;
    const coaching = data?.aiCoaching;

    const heatmapZones: UiHeatmapZone[] =
      position?.heatmapData?.map((p, idx) => ({
        x: p.x,
        y: p.y,
        intensity: 0.4 + (idx % 5) * 0.12,
      })) ?? [];

    const positionData =
      position?.heatmapData?.map((p) => ({ x: p.x, y: p.y })) ?? [];

    const strokeData = strokeTypes
      ? [
          {
            name: "스매시",
            key: "smash" as const,
            count: strokeTypes.smash,
            color: "#ef4444",
          },
          {
            name: "클리어",
            key: "clear" as const,
            count: strokeTypes.clear,
            color: "#3b82f6",
          },
          {
            name: "드롭",
            key: "drop" as const,
            count: strokeTypes.drop,
            color: "#10b981",
          },
          {
            name: "드라이브",
            key: "drive" as const,
            count: strokeTypes.drive,
            color: "#f59e0b",
          },
        ].filter((s) => typeof s.count === "number")
      : [];

    const abilityData = ability
      ? [
          { name: "스매시", value: ability.smash },
          { name: "수비", value: ability.defense },
          { name: "스피드", value: ability.speed },
          { name: "지구력", value: ability.stamina },
          { name: "정확도", value: ability.accuracy },
        ]
      : [];

    const feedbackText = coaching?.feedbackText ?? "";

    return {
      summary,
      heatmapZones,
      positionData,
      strokeData,
      abilityData,
      feedbackText,
    };
  }, [report]);

  // ---- 로딩/에러 UI ----
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header
          currentPage="report"
          onNavigate={onNavigate}
          onLogout={onLogout}
          hasSelectedVideo={true}
        />
        <main className="container mx-auto px-6 py-10 max-w-6xl">
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
          >
            ← 돌아가기
          </button>

          <div className="rounded-xl border border-gray-100 p-8">
            <div className="text-sm font-semibold text-gray-700">
              리포트 불러오는 중...
            </div>
            <div className="mt-2 text-xs text-gray-400">잠시만 기다려줘.</div>
          </div>
        </main>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-white">
        <Header
          currentPage="report"
          onNavigate={onNavigate}
          onLogout={onLogout}
          hasSelectedVideo={true}
        />
        <main className="container mx-auto px-6 py-10 max-w-6xl">
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
          >
            ← 돌아가기
          </button>

          <div className="rounded-xl border border-red-100 bg-red-50 p-8">
            <div className="text-sm font-bold text-red-700">
              리포트를 불러오지 못했습니다.
            </div>
            <div className="mt-2 text-xs text-red-600">{errorMsg}</div>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-sm text-red-700"
            >
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
        <Header
          currentPage="report"
          onNavigate={onNavigate}
          onLogout={onLogout}
          hasSelectedVideo={true}
        />
        <main className="container mx-auto px-6 py-10 max-w-6xl">
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
          >
            ← 돌아가기
          </button>

          <div className="rounded-xl border border-gray-100 p-8">
            <div className="text-sm font-semibold text-gray-700">
              리포트 데이터가 비어있어
            </div>
            <div className="mt-2 text-xs text-gray-400">
              백엔드 응답을 확인해줘.
            </div>
          </div>
        </main>
      </div>
    );
  }

  const summary = ui.summary;

  return (
    <div className="min-h-screen bg-white">
      <Header
        currentPage="report"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={true}
      />

      <main className="container mx-auto px-6 py-10 max-w-6xl">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
        >
          ← 돌아가기
        </button>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Award className="size-4 text-blue-500" />
              <div className="text-xs font-semibold text-gray-500">내 점수</div>
            </div>
            <div className="text-3xl font-bold text-blue-600">{summary.myScore}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Award className="size-4 text-gray-600" />
              <div className="text-xs font-semibold text-gray-500">상대 점수</div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{summary.opponentScore}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="size-4 text-purple-500" />
              <div className="text-xs font-semibold text-gray-500">총 스트로크</div>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {summary.totalStrokeCount}회
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-orange-500" />
              <div className="text-xs font-semibold text-gray-500">경기 시간</div>
            </div>
            <div className="text-3xl font-bold text-orange-600">{summary.matchTime}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Heatmap */}
          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2 text-gray-900">
              <Target className="size-5 text-blue-600" />
              히트맵
            </h2>
            <p className="text-[11px] text-gray-400 mb-6 font-medium">
              {ui.heatmapZones.length > 0
                ? "클릭하여 선택 (time 데이터가 있으면 영상 점프 연결 가능)"
                : "히트맵 데이터가 없습니다."}
            </p>

            <div className="aspect-[4/3] bg-[#f0f9ff] rounded-xl relative overflow-hidden border border-gray-100">
              {/* Court lines */}
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 300 400">
                  <rect x="20" y="20" width="260" height="360" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="150" y1="20" x2="150" y2="380" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="20" y1="200" x2="280" y2="200" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="20" y1="120" x2="280" y2="120" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="20" y1="280" x2="280" y2="280" stroke="#cbd5e1" strokeWidth="1" />
                </svg>
              </div>

              {/* Heatmap points */}
              {ui.heatmapZones.map((zone, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedHeatmapPoint(index);
                    if (typeof zone.time === "number") onJumpToVideo(zone.time);
                  }}
                  className={`absolute rounded-full transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                    selectedHeatmapPoint === index ? "ring-2 ring-blue-500 ring-offset-2" : ""
                  }`}
                  style={{
                    left: `${zone.y}%`,
                    top: `${zone.x}%`,
                    width: `${24 + zone.intensity * 36}px`,
                    height: `${24 + zone.intensity * 36}px`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: `rgba(248, 113, 113, ${0.25 + zone.intensity * 0.45})`,
                  }}
                  aria-label={`heatmap-point-${index}`}
                />
              ))}
            </div>
          </div>

          {/* Position Scatter Plot */}
          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
              <ScatterIcon className="size-5 text-indigo-600" />
              위치 산점도
            </h2>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                  <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter name="위치" data={ui.positionData} fill="#60a5fa" fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Stroke Types */}
          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-8 flex items-center gap-2 text-gray-900">
              <Zap className="size-5 text-purple-600" />
              스트로크 종류
            </h2>

            <div className="h-[200px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ui.strokeData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                    {ui.strokeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {ui.strokeData.map((stroke) => (
                <div key={stroke.name} className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stroke.color }} />
                    <span className="text-xs font-semibold text-gray-600">{stroke.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-500">{stroke.count}회</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ability Analysis */}
          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
              <Award className="size-5 text-orange-500" />
              능력치 분석
            </h2>

            <div className="h-[240px] mb-6 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={ui.abilityData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Radar name="능력치" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-3 px-2">
              {ui.abilityData.map((ability) => (
                <div key={ability.name} className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-xs font-semibold text-gray-500">{ability.name}</span>
                  <span className="text-xs font-bold text-blue-600">{ability.value}점</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ✅ AI 브리핑 섹션 (채팅 대신 요약 리포트) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="size-5 text-blue-600" />
            <h3 className="font-bold text-gray-800">AI 브리핑</h3>
          </div>

          {aiBriefingLoading && (
            <div className="text-sm text-blue-600 animate-pulse">
              AI가 리포트를 요약 중입니다...
            </div>
          )}

          {aiBriefingError && (
            <div className="text-sm text-red-600">
              브리핑 생성 실패: {aiBriefingError}
            </div>
          )}

          {!aiBriefingLoading && !aiBriefingError && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
              {aiBriefing ? aiBriefing : "AI 브리핑 데이터가 없습니다."}
            </div>
          )}

          <div className="mt-3 text-[11px] text-gray-400">
            * 이 브리핑은 경기 분석 데이터를 기반으로 자동 생성됩니다.
          </div>
        </div>

        {/* Match Summary */}
        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold mb-8 text-gray-900">경기 결과 요약</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#f8fafc] rounded-2xl p-8 text-center border border-gray-50 transition-all hover:bg-[#f1f5f9]">
              <div className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">
                점수 / 결과
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {summary.myScore} - {summary.opponentScore}
              </div>
              <div
                className={`text-sm font-bold ${
                  summary.matchOutcome === "WIN"
                    ? "text-green-600"
                    : summary.matchOutcome === "LOSE"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {summary.matchOutcome === "WIN"
                  ? "승리"
                  : summary.matchOutcome === "LOSE"
                    ? "패배"
                    : "무승부"}
              </div>
            </div>

            <div className="bg-[#f8fafc] rounded-2xl p-8 text-center border border-gray-50 transition-all hover:bg-[#f1f5f9]">
              <div className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">
                총 시간
              </div>
              <div className="text-4xl font-bold text-blue-600">{summary.matchTime}</div>
              <div className="mt-2 text-xs font-semibold text-gray-500">
                총 스트로크: {summary.totalStrokeCount}회
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}