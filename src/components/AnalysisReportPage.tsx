import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Bot,
  Clock,
  ScatterChart as ScatterIcon,
  Target,
  Zap,
  Send,
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

// ✅ env에서 키 읽기
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// ✅ 모델 ID는 버전 붙은 걸로 (v1beta에서 baseModelId로 404 뜨는 케이스 대응)
const GEMINI_MODEL_ID = "gemini-2.5-flash-latest";

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
  time?: number; // API에 없으면 undefined
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

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: string; parts: string }[]
  >([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

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

  // 데이터 매핑 (report가 없을 수도 있으니 안전하게)
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
        // intensity는 임시 값
        intensity: 0.4 + (idx % 5) * 0.12,
      })) ?? [];

    const positionData =
      position?.heatmapData?.map((p) => ({ x: p.x, y: p.y })) ?? [];

    const strokeData = strokeTypes
      ? [
          { name: "스매시", key: "smash" as const, count: strokeTypes.smash, color: "#ef4444" },
          { name: "클리어", key: "clear" as const, count: strokeTypes.clear, color: "#3b82f6" },
          { name: "드롭", key: "drop" as const, count: strokeTypes.drop, color: "#10b981" },
          { name: "드라이브", key: "drive" as const, count: strokeTypes.drive, color: "#f59e0b" },
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

  // ✅ Gemini 연동 (여기만 핵심)
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !report) return;

    if (!API_KEY) {
      setChatHistory((prev) => [
        ...prev,
        { role: "model", parts: "Gemini API Key가 설정되지 않았습니다. .env.local을 확인해주세요." },
      ]);
      return;
    }

    const userMessage = chatInput;
    setChatInput("");

    const updatedHistory = [...chatHistory, { role: "user", parts: userMessage }];
    setChatHistory(updatedHistory);
    setIsChatLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);

      const context = `
당신은 전문 배드민턴 코치입니다. 다음은 사용자의 경기 분석 데이터입니다:
- 결과: ${report.data.summary.matchOutcome} (${report.data.summary.myScore} 대 ${report.data.summary.opponentScore})
- 총 스트로크: ${report.data.summary.totalStrokeCount}회
- 능력치: 스매시(${report.data.abilityMetrics.smash}), 수비(${report.data.abilityMetrics.defense}), 정확도(${report.data.abilityMetrics.accuracy})
- 코치 피드백 요약: ${report.data.aiCoaching.feedbackText}

사용자의 질문에 대해 이 데이터를 바탕으로 친절하고 전문적으로 답변해주세요.
`;

      const model = genAI.getGenerativeModel({
         model: "gemini-2.5-flash",
        });

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: context }] },
          { role: "model", parts: [{ text: "준비되었습니다!" }] },
          ...chatHistory.map((h) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.parts }],
          })),
        ],
      });

      const result = await chat.sendMessage(userMessage);
      const responseText = result.response.text();

      setChatHistory([...updatedHistory, { role: "model", parts: responseText }]);
    } catch (error: any) {
      console.error("Gemini Error:", error);
      setChatHistory([
        ...updatedHistory,
        {
          role: "model",
          parts:
            "죄송합니다. 답변을 생성하는 중에 오류가 발생했습니다. (API Key / Model ID / 권한 설정을 확인해주세요)",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

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
            <div className="text-3xl font-bold text-purple-600">{summary.totalStrokeCount}회</div>
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

        {/* AI 챗봇 섹션 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="size-5 text-blue-600" />
            <h3 className="font-bold text-gray-800">AI 코치와 대화하기</h3>
          </div>

          <div className="h-80 overflow-y-auto mb-4 space-y-3 p-4 bg-gray-50 rounded-xl">
            {chatHistory.length === 0 && (
              <p className="text-xs text-gray-300 text-center mt-30">
                경기에 대해 궁금한 점을 물어보세요!
                <br />
                ( 예: "제 스매시 타이밍은 어땠나요?" )
              </p>
            )}
            {chatHistory.map((chat, idx) => (
              <div
                key={idx}
                className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    chat.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  {chat.parts}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="text-xs text-blue-500 animate-pulse">
                Gemini 코치가 생각 중...
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="질문을 입력하세요..."
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={isChatLoading}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Send className="size-5" />
            </button>
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