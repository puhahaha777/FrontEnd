import { useState, useEffect, useCallback } from "react";
import {
  Upload,
  Plus,
  X,
  Film,
  Clock,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";
import { Header, type Page } from "./Header";
import {
  fetchDashboard,
  deleteVideo,
  DashboardResponse,
} from "../api/dashboardApi";
import { VideoItem } from "../components/VideoItem";
import { Footer } from "./ui/footer";

interface UserInfo {
  nickname?: string;
  email?: string;
  avatarUrl?: string;
}

interface VideoRecord {
  id: string;
  name: string;
  date: string;
  duration: string;
  score?: string;
  thumbnail?: string;
  status?: "uploading" | "processing" | "completed" | "error";
}

interface DashboardPageProps {
  onLogout: () => void;
  onViewVideo: (id: string) => void;
  onViewReport: (id: string) => void;
  onNavigate: (page: Page) => void;
  hasSelectedVideo: boolean;
  user?: UserInfo;
}

function TrendSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 36;

  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.8"
      />
      {(() => {
        const last = data[data.length - 1];
        const x = w;
        const y = h - ((last - min) / range) * (h - 6) - 3;
        return <circle cx={x} cy={y} r="3" fill={color} />;
      })()}
    </svg>
  );
}

const BADMINTON_TIPS = [
  {
    icon: "🏸",
    title: "스매시 파워업",
    desc: "임팩트 순간 손목 스냅을 극대화하면 셔틀 속도가 15~20% 향상됩니다.",
  },
  {
    icon: "👣",
    title: "풋워크 기초",
    desc: "리턴 기준 위치(센터)로 빠르게 복귀하는 습관이 수비력을 크게 높입니다.",
  },
  {
    icon: "🎯",
    title: "드롭샷 전략",
    desc: "네트 근처 빈 공간을 노리는 드롭은 상대 체력 소모에 효과적입니다.",
  },
  {
    icon: "💪",
    title: "코어 강화",
    desc: "복근·허리 근력 강화로 스윙 안정성과 부상 방지 두 마리를 잡으세요.",
  },
  {
    icon: "👁️",
    title: "셔틀 예측",
    desc: "상대 라켓 각도와 어깨 방향을 읽으면 0.1초 먼저 움직일 수 있습니다.",
  },
  {
    icon: "🌬️",
    title: "호흡 관리",
    desc: "스트로크 직전 짧게 내쉬는 호흡이 근육 긴장을 줄이고 정확도를 높입니다.",
  },
];

const MOCK_TREND = {
  smash: [62, 68, 65, 72, 70, 75, 75],
  defense: [70, 72, 75, 73, 78, 80, 88],
  accuracy: [60, 65, 63, 70, 75, 78, 80],
  labels: ["6주전", "5주전", "4주전", "3주전", "2주전", "지난주", "이번주"],
};

const MOCK_ACTIVITY = [
  { day: "월", usageCount: 5, uploadCount: 1 },
  { day: "화", usageCount: 8, uploadCount: 2 },
  { day: "수", usageCount: 4, uploadCount: 0 },
  { day: "목", usageCount: 10, uploadCount: 3 },
  { day: "금", usageCount: 7, uploadCount: 1 },
  { day: "토", usageCount: 12, uploadCount: 4 },
  { day: "일", usageCount: 6, uploadCount: 1 },
];

function ActivityChartCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="size-4 text-blue-500" />
        <h2 className="text-sm font-bold text-gray-900">활동 통계</h2>
        <span className="ml-auto text-[10px] text-gray-400 font-mono">
          최근 7일 · 사용/업로드 추이
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-5">
        사이트 사용 횟수와 업로드된 영상 수를 한 번에 확인할 수 있습니다.
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={MOCK_ACTIVITY}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                boxShadow: "0 6px 24px rgba(15,23,42,0.08)",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => {
                if (name === "usageCount") return [`${value}회`, "사이트 사용"];
                if (name === "uploadCount") return [`${value}개`, "영상 업로드"];
                return [value, name];
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                color: "#64748b",
                paddingTop: "12px",
              }}
              formatter={(value) => {
                if (value === "usageCount") return "사이트 사용 횟수";
                if (value === "uploadCount") return "업로드 영상 수";
                return value;
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="uploadCount"
              name="uploadCount"
              radius={[8, 8, 0, 0]}
              barSize={26}
              fill="#60a5fa"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="usageCount"
              name="usageCount"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: "#2563eb" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">
            총 사이트 사용
          </p>
          <p className="text-lg font-black text-blue-700">
            {MOCK_ACTIVITY.reduce((sum, item) => sum + item.usageCount, 0)}회
          </p>
        </div>
        <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3">
          <p className="text-[11px] font-bold text-sky-500 uppercase tracking-widest mb-1">
            총 업로드 수
          </p>
          <p className="text-lg font-black text-sky-700">
            {MOCK_ACTIVITY.reduce((sum, item) => sum + item.uploadCount, 0)}개
          </p>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage({
  onLogout,
  onViewVideo,
  onViewReport,
  onNavigate,
  hasSelectedVideo,
  user,
}: DashboardPageProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);

  const [stats, setStats] = useState<
    DashboardResponse["data"]["dashboardSummary"] | null
  >(null);
  const [videos, setVideos] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const json = await fetchDashboard();
      setStats(json.data.dashboardSummary);
      setVideos(
        json.data.recentVideos.map((v) => ({
          id: String(v.videoId),
          name: v.title,
          date: v.date,
          duration: v.playTime || "00:00",
          score: v.matchScore,
          thumbnail: v.thumbnailUrl,
          status: v.playTime === "분석 중" ? "processing" : "completed",
        })),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const iv = setInterval(() => {
      setTipIndex((i) => (i + 1) % BADMINTON_TIPS.length);
    }, 6000);
    return () => clearInterval(iv);
  }, []);

  const hasProcessingVideo = videos.some(
    (v) => v.status === "processing" || v.duration === "분석 중",
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasProcessingVideo) {
      interval = setInterval(fetchData, 5000);
    }
    return () => clearInterval(interval);
  }, [hasProcessingVideo, fetchData]);

  const handleDelete = async (id: string) => {
    if (id.startsWith("temp-")) {
      setVideos((prev) => prev.filter((v) => v.id !== id));
      return;
    }

    if (confirm("이 영상을 삭제하시겠습니까?")) {
      try {
        await deleteVideo(id);
        setVideos((prev) => prev.filter((v) => v.id !== id));
        if (stats) {
          setStats({
            ...stats,
            totalVideos: Math.max(0, stats.totalVideos - 1),
          });
        }
      } catch (e) {
        alert("삭제 중 오류가 발생했습니다.");
        console.error(e);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadFile) {
      alert("업로드할 영상 파일을 선택해주세요.");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempVideo: VideoRecord = {
      id: tempId,
      name: videoName || uploadFile.name,
      date: new Date().toISOString().split("T")[0],
      duration: "업로드 중...",
      status: "uploading",
    };

    setVideos([tempVideo, ...videos]);
    setShowUploadModal(false);

    const formData = new FormData();
    formData.append("videoFile", uploadFile);
    formData.append("title", videoName || uploadFile.name);
    formData.append("matchDate", new Date().toISOString().split("T")[0]);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://localhost:8080/api/v1/videos", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const newVideoData = await response.json();

      if (stats) {
        setStats({ ...stats, totalVideos: stats.totalVideos + 1 });
      }

      setVideos((prevVideos) =>
        prevVideos.map((video) =>
          video.id === tempId
            ? {
                ...video,
                id: String(newVideoData.videoId),
                name: newVideoData.title,
                duration: "분석 중",
                status: "processing",
              }
            : video,
        ),
      );
    } catch (error) {
      console.error("Upload Error:", error);
      setVideos((prevVideos) =>
        prevVideos.map((video) =>
          video.id === tempId
            ? { ...video, duration: "업로드 실패", status: "error" }
            : video,
        ),
      );
      alert("영상 업로드 중 오류가 발생했습니다.");
    }
  };

  const handlePrevTip = () => {
    setTipIndex((prev) => (prev === 0 ? BADMINTON_TIPS.length - 1 : prev - 1));
  };

  const handleNextTip = () => {
    setTipIndex((prev) => (prev === BADMINTON_TIPS.length - 1 ? 0 : prev + 1));
  };

  const currentTip = BADMINTON_TIPS[tipIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        currentPage="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={hasSelectedVideo}
        user={user}
      />

      <main className="flex-1 container mx-auto px-6 py-10 max-w-6xl">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-[0.15em] mb-1">
              내 경기 기록
            </p>
            <h1 className="text-3xl font-black text-gray-900 leading-tight">
              영상 대시보드
            </h1>
            <p className="mt-1.5 text-sm text-gray-400 font-medium">
              업로드한 경기 영상과 AI 분석 리포트를 관리하세요
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200 text-sm font-semibold"
          >
            <Upload className="size-4" />
            영상 업로드
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-5"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-gray-200 rounded-l-2xl animate-pulse" />
                <div className="w-11 h-11 rounded-xl bg-gray-200 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 bg-gray-200 rounded animate-pulse w-24" />
                  <div className="h-7 bg-gray-200 rounded animate-pulse w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-5 group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-l-2xl" />
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 flex-shrink-0">
                <Film className="size-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                  총 업로드 영상
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-gray-900 tabular-nums leading-none">
                    {stats.totalVideos}
                  </span>
                  <span className="text-sm font-semibold text-gray-400">개</span>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-blue-50 opacity-50 group-hover:opacity-80 transition-opacity" />
            </div>

            <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-5 group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500 rounded-l-2xl" />
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 flex-shrink-0">
                <Clock className="size-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                  총 영상 시간
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-gray-900 tabular-nums leading-none">
                    {stats.totalAnalysisTime}
                  </span>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-indigo-50 opacity-50 group-hover:opacity-80 transition-opacity" />
            </div>
          </div>
        ) : null}

        <ActivityChartCard />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="size-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-gray-900">
                퍼포먼스 트렌드
              </h2>
              <span className="ml-auto text-[10px] text-gray-400 font-mono">
                최근 7주 · 분석 데이터 기반
              </span>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: "스매시",
                  data: MOCK_TREND.smash,
                  color: "#ef4444",
                  current: MOCK_TREND.smash[6],
                },
                {
                  label: "수비력",
                  data: MOCK_TREND.defense,
                  color: "#3b82f6",
                  current: MOCK_TREND.defense[6],
                },
                {
                  label: "정확도",
                  data: MOCK_TREND.accuracy,
                  color: "#10b981",
                  current: MOCK_TREND.accuracy[6],
                },
              ].map(({ label, data, color, current }) => {
                const prev = data[data.length - 2];
                const diff = current - prev;

                return (
                  <div key={label} className="flex items-center gap-4">
                    <span className="w-14 text-xs font-semibold text-gray-500 shrink-0">
                      {label}
                    </span>
                    <div className="flex-1">
                      <TrendSparkline data={data} color={color} />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-sm font-black tabular-nums"
                        style={{ color }}
                      >
                        {current}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          diff >= 0
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {diff >= 0 ? "+" : ""}
                        {diff}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[10px] text-gray-300 font-mono">
              * 트렌드는 분석된 경기 리포트 데이터를 기반으로 자동 계산됩니다.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-gradient-to-br from-[#1a2b4c] to-[#2a4070] rounded-2xl p-5 text-white flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="size-4 text-[#8ce600]" />
                  <span className="text-[10px] font-bold text-[#8ce600] uppercase tracking-widest">
                    오늘의 배드민턴 팁
                  </span>
                </div>

                <div className="text-3xl mb-2">{currentTip.icon}</div>
                <p className="text-sm font-bold mb-1">{currentTip.title}</p>
                <p className="text-xs text-white/70 leading-relaxed min-h-[48px]">
                  {currentTip.desc}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <button
                    type="button"
                    onClick={handlePrevTip}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="이전 팁"
                  >
                    <ChevronLeft className="size-4 text-white" />
                  </button>

                  <div className="flex gap-1">
                    {BADMINTON_TIPS.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTipIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === tipIndex
                            ? "w-5 bg-[#8ce600]"
                            : "w-2 bg-white/30 hover:bg-white/50"
                        }`}
                        aria-label={`${i + 1}번째 팁으로 이동`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextTip}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="다음 팁"
                  >
                    <ChevronRight className="size-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-gray-900">최근 영상</span>
              {!isLoading && videos.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold tabular-nums">
                  {videos.length}
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="p-6 flex items-center gap-6">
                  <div className="w-32 h-20 rounded-lg bg-gray-200 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-9 w-9 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Upload className="size-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">
                업로드된 영상이 없습니다
              </p>
              <p className="text-xs text-gray-400">
                첫 번째 경기 영상을 업로드해보세요
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-5 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
              >
                영상 업로드
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {videos.map((video) => (
                <VideoItem
                  key={video.id}
                  video={video}
                  onViewVideo={onViewVideo}
                  onViewReport={onViewReport}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  영상 업로드
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  경기 영상을 업로드하여 AI 분석을 받으세요
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              <form onSubmit={handleUpload}>
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    영상 이름
                  </label>
                  <input
                    type="text"
                    value={videoName}
                    onChange={(e) => setVideoName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 placeholder:text-gray-400"
                    placeholder="예: 주말 복식 경기"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    영상 파일
                  </label>

                  <label
                    htmlFor="video-upload"
                    className={`flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${
                      uploadFile
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        setUploadFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                      id="video-upload"
                    />

                    {uploadFile ? (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                          <Film className="size-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-blue-700 text-center truncate max-w-full px-4">
                          {uploadFile.name}
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          클릭하여 파일 변경
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center mb-3">
                          <Plus className="size-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-500">
                          클릭하여 파일 선택
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          또는 드래그 앤 드롭
                        </p>
                      </>
                    )}
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-100 disabled:opacity-50"
                  >
                    업로드 시작
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}