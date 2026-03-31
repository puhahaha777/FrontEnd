import { useState, useEffect, useCallback } from "react";
import {
  Upload, Plus, X, Film, Clock,
  Lightbulb, ChevronLeft, ChevronRight,
} from "lucide-react";
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

// ─── 배드민턴 팁 데이터 ─────────────────────────────────────────────────────
const BADMINTON_TIPS = [
  { icon: "🏸", title: "스매시 파워업", desc: "임팩트 순간 손목 스냅을 극대화하면 셔틀 속도가 15~20% 향상됩니다." },
  { icon: "👣", title: "풋워크 기초", desc: "리턴 기준 위치(센터)로 빠르게 복귀하는 습관이 수비력을 크게 높입니다." },
  { icon: "🎯", title: "드롭샷 전략", desc: "네트 근처 빈 공간을 노리는 드롭은 상대 체력 소모에 효과적입니다." },
  { icon: "💪", title: "코어 강화", desc: "복근·허리 근력 강화로 스윙 안정성과 부상 방지 두 마리를 잡으세요." },
  { icon: "👁️", title: "셔틀 예측", desc: "상대 라켓 각도와 어깨 방향을 읽으면 0.1초 먼저 움직일 수 있습니다." },
  { icon: "🌬️", title: "호흡 관리", desc: "스트로크 직전 짧게 내쉬는 호흡이 근육 긴장을 줄이고 정확도를 높입니다." },
];

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

  // 팁 슬라이더 상태
  const [tipIndex, setTipIndex] = useState(0);
  const [tipAnimating, setTipAnimating] = useState(false);
  const [tipDir, setTipDir] = useState<"left" | "right">("right");

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

  useEffect(() => { fetchData(); }, [fetchData]);

  // 팁 자동 순환 (6초) — tipIndex 변경 시마다 타이머 리셋
  useEffect(() => {
    const iv = setInterval(() => changeTip("right"), 6000);
    return () => clearInterval(iv);
  }, [tipIndex]);

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

  // 팁 전환
  const changeTip = (dir: "left" | "right") => {
    if (tipAnimating) return;
    setTipDir(dir);
    setTipAnimating(true);
    setTimeout(() => {
      setTipIndex((i) =>
        dir === "right"
          ? (i + 1) % BADMINTON_TIPS.length
          : (i - 1 + BADMINTON_TIPS.length) % BADMINTON_TIPS.length
      );
      setTipAnimating(false);
    }, 200);
  };

  const jumpToTip = (i: number) => {
    if (tipAnimating || i === tipIndex) return;
    setTipDir(i > tipIndex ? "right" : "left");
    setTipAnimating(true);
    setTimeout(() => { setTipIndex(i); setTipAnimating(false); }, 200);
  };

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
          setStats({ ...stats, totalVideos: Math.max(0, stats.totalVideos - 1) });
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

    // 새 영상을 목록 최상단에 추가
    setVideos((prev) => [tempVideo, ...prev]);
    setShowUploadModal(false);
    setVideoName("");
    setUploadFile(null);

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

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-[0.15em] mb-1">
              내 경기 기록
            </p>
            <h1 className="text-3xl font-black text-gray-900 leading-tight">
              영상 대시보드
            </h1>
            <p className="mt-1 text-sm text-gray-400 font-medium">
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

        {/* ── Stats + Tip row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          {/* Stats cards (2/3) */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {isLoading ? (
              <>
                {[0, 1].map((i) => (
                  <div key={i} className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-5">
                    <div className="absolute left-0 top-0 h-full w-1 bg-gray-200 rounded-l-2xl animate-pulse" />
                    <div className="w-11 h-11 rounded-xl bg-gray-200 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 bg-gray-200 rounded animate-pulse w-24" />
                      <div className="h-7 bg-gray-200 rounded animate-pulse w-16" />
                    </div>
                  </div>
                ))}
                <div className="col-span-2 h-14 bg-white rounded-2xl border border-dashed border-gray-200 animate-pulse" />
              </>
            ) : stats ? (
              <>
                {/* 총 업로드 영상 */}
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

                {/* 총 영상 시간 */}
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

                {/* 하단 플레이스홀더 */}
                <div className="col-span-2 flex items-center px-5 py-3.5 bg-white rounded-2xl border border-dashed border-gray-200">
                  <span className="text-[11px] text-gray-300 font-mono uppercase tracking-widest">
                    📊 추가 통계 지표는 추후 업데이트됩니다
                  </span>
                </div>
              </>
            ) : null}
          </div>

          {/* 오늘의 배드민턴 팁 (1/3) */}
          <div className="bg-gradient-to-br from-[#1a2b4c] to-[#2a4070] rounded-2xl p-5 text-white relative overflow-hidden flex flex-col">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-10 translate-x-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-8 -translate-x-8 pointer-events-none" />

            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <Lightbulb className="size-3.5 text-[#8ce600] shrink-0" />
              <span className="text-[10px] font-bold text-[#8ce600] uppercase tracking-widest">
                오늘의 배드민턴 팁
              </span>
            </div>

            {/* 팁 본문 — 페이드+슬라이드 */}
            <div className="flex-1 relative z-10 overflow-hidden">
              <div
                style={{
                  opacity: tipAnimating ? 0 : 1,
                  transform: tipAnimating
                    ? `translateX(${tipDir === "right" ? "-10px" : "10px"})`
                    : "translateX(0)",
                  transition: "opacity 0.2s ease, transform 0.2s ease",
                }}
              >
                <div className="text-3xl mb-2">{currentTip.icon}</div>
                <p className="text-sm font-bold mb-1.5 leading-snug">{currentTip.title}</p>
                <p className="text-xs text-white/65 leading-relaxed">{currentTip.desc}</p>
              </div>
            </div>

            {/* 하단: 좌우 버튼 + 인디케이터 */}
            <div className="relative z-10 flex items-center justify-between mt-5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => changeTip("left")}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="이전 팁"
                >
                  <ChevronLeft className="size-4 text-white" />
                </button>
                <button
                  onClick={() => changeTip("right")}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="다음 팁"
                >
                  <ChevronRight className="size-4 text-white" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                {BADMINTON_TIPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => jumpToTip(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === tipIndex
                        ? "w-5 bg-[#8ce600]"
                        : "w-1.5 bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`팁 ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Video List ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-gray-900">경기 영상 목록</span>
              {!isLoading && videos.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold tabular-nums">
                  {videos.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="size-3.5" />
              새 영상 추가
            </button>
          </div>

          {/* 스켈레톤 */}
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
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Upload className="size-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">업로드된 영상이 없습니다</p>
              <p className="text-xs text-gray-400">첫 번째 경기 영상을 업로드해보세요</p>
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

      {/* ── Upload Modal ─────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">영상 업로드</h2>
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
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
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
                        <p className="text-xs text-blue-500 mt-1">클릭하여 파일 변경</p>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center mb-3">
                          <Plus className="size-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-500">클릭하여 파일 선택</p>
                        <p className="text-xs text-gray-400 mt-1">또는 드래그 앤 드롭</p>
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
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
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