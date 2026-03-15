import { useState, useEffect, useCallback } from "react";
import { Upload, Plus, X, Film, Clock } from "lucide-react";
import { Header, type Page } from "./Header";
import {
  fetchDashboard,
  deleteVideo,
  DashboardResponse,
} from "../api/dashboardApi";
import { VideoItem } from "../components/VideoItem";

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
}

export function DashboardPage({
  onLogout,
  onViewVideo,
  onViewReport,
  onNavigate,
  hasSelectedVideo,
}: DashboardPageProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState("");

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
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentPage="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={hasSelectedVideo}
      />

      <main className="container mx-auto px-6 py-10 max-w-6xl">
        {/* ── Page Header ─────────────────────────────────────── */}
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

        {/* ── Stats Cards ─────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Total Videos */}
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
                  <span className="text-sm font-semibold text-gray-400">
                    개
                  </span>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-blue-50 opacity-50 group-hover:opacity-80 transition-opacity" />
            </div>

            {/* Total Analysis Time */}
            <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-5 group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500 rounded-l-2xl" />
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 flex-shrink-0">
                <Clock className="size-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                  총 분석 시간
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
        )}

        {/* ── Video List ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* List header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-gray-900">최근 영상</span>
              {videos.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold tabular-nums">
                  {videos.length}
                </span>
              )}
            </div>
          </div>

          {videos.length === 0 ? (
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

      {/* ── Upload Modal ─────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
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
