import { useState, useEffect, useCallback } from "react";
import { Upload, Plus, X } from "lucide-react";
import { Header, type Page } from "./Header";
import {
  fetchDashboard,
  deleteVideo,
  DashboardResponse,
} from "../api/dashboardApi";
import { VideoItem } from "../components/VideoItem"; // 분리한 컴포넌트 import

interface VideoRecord {
  id: string;
  name: string;
  date: string;
  duration: string;
  score?: string;
  thumbnail?: string;
  // 영상 상태 관리
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

  // 통계 상태 관리
  const [stats, setStats] = useState<
    DashboardResponse["data"]["dashboardSummary"] | null
  >(null);
  // 영상 목록 상태 관리
  const [videos, setVideos] = useState<any[]>([]); // 타입은 위에서 정의한 VideoRecord 배열 사용

  // 데이터 호출 로직을 재사용 가능한 함수로 분리
  const fetchData = useCallback(async () => {
    try {
      const json = await fetchDashboard();
      setStats(json.data.dashboardSummary);

      // API에서 받아온 데이터를 VideoRecord 형태로 매핑하여 상태에 저장
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

  // 초기 로드
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 분석 중인 영상이 있는지 확인
  const hasProcessingVideo = videos.some(
    (v) => v.status === "processing" || v.duration === "분석 중",
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (hasProcessingVideo) {
      // 5초마다 대시보드 데이터를 다시 불러옴
      interval = setInterval(fetchData, 5000); // fetchData 재사용
    }
    return () => clearInterval(interval);
  }, [hasProcessingVideo, fetchData]);

  // 영상 삭제 핸들러 API (임시)
  const handleDelete = async (id: string) => {
    // 임시 업로드 중인 파일 삭제 처리
    if (id.startsWith("temp-")) {
      setVideos((prev) => prev.filter((v) => v.id !== id));
      return;
    }

    if (confirm("이 영상을 삭제하시겠습니까?")) {
      try {
        await deleteVideo(id); // API 호출
        setVideos((prev) => prev.filter((v) => v.id !== id)); // 상태 업데이트

        // 통계 업데이트 (선택 사항)
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

    // 1. 임시 ID 생성 및 목록에 '업로드 중' 상태로 즉시 추가 (Optimistic UI)
    const tempId = `temp-${Date.now()}`;
    const tempVideo: VideoRecord = {
      id: tempId,
      name: videoName || uploadFile.name,
      date: new Date().toISOString().split("T")[0],
      duration: "업로드 중...",
      status: "uploading",
    };

    setVideos([tempVideo, ...videos]); // 목록 맨 앞에 추가

    // 2. 모달 즉시 닫기 및 초기화
    setShowUploadModal(false);

    // 2. FormData 객체 생성 (파일 + 메타데이터)
    const formData = new FormData();

    // 백엔드 @RequestPart("videoFile") 또는 파라미터명과 일치해야 함
    formData.append("videoFile", uploadFile);

    // 쿼리 파라미터로 받을 경우 URL 뒤에 붙이고,
    // 만약 파라미터로 받는다면 아래처럼 append
    formData.append("title", videoName || uploadFile.name);
    formData.append("matchDate", new Date().toISOString().split("T")[0]);

    // 3. 백그라운드에서 API 요청 진행
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://localhost:8080/api/v1/videos", {
        method: "POST",
        headers: {
          // FormData를 사용할 때는 'Content-Type' 헤더를 명시적으로 설정하지 않아야 함
          // 'Authorization': `Bearer ${token}`,
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed"); // 에러 발생 시 catch 블록으로 이동
      }

      const newVideoData = await response.json();

      // 통계 카운트 즉시 업데이트
      if (stats) {
        setStats({
          ...stats,
          totalVideos: stats.totalVideos + 1,
        });
      }

      // 4. 업로드 성공 시: 임시 데이터를 실제 서버 데이터로 교체
      setVideos((prevVideos) =>
        prevVideos.map((video) =>
          video.id === tempId
            ? {
                ...video,
                id: String(newVideoData.videoId),
                name: newVideoData.title,
                duration: "분석 중",
                status: "processing", // 분석 서버 호출 단계이므로 '처리 중'이 적절함
              }
            : video,
        ),
      );
    } catch (error) {
      console.error("Upload Error:", error);
      // 5. 실패 시: 상태를 error로 변경하여 UI에 표시
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
      {/* Header */}
      <Header
        currentPage="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={hasSelectedVideo}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl mb-2">내 경기 기록</h1>
            <p className="text-gray-600">
              업로드한 영상과 분석 리포트를 확인하세요
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="size-5" />
            <span>영상 업로드</span>
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-gray-600 mb-2">총 업로드 영상</div>
              <div className="text-3xl text-blue-600">{stats.totalVideos}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-gray-600 mb-2">총 분석 시간</div>
              <div className="text-3xl text-indigo-600">
                {stats.totalAnalysisTime}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-gray-600 mb-2">평균 점수</div>
              <div className="text-3xl text-purple-600">
                {stats.averageScore}점
              </div>
            </div>
          </div>
        )}

        {/* Video List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl">최근 영상</h2>
          </div>

          {videos.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Upload className="size-12 mx-auto mb-4 text-gray-400" />
              <p>업로드된 영상이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">영상 업로드</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="mb-6">
                <label className="block text-sm mb-2 text-gray-700">
                  영상 이름
                </label>
                <input
                  type="text"
                  value={videoName}
                  onChange={(e) => setVideoName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 주말 복식 경기"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm mb-2 text-gray-700">
                  영상 파일
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Plus className="size-12 mx-auto mb-4 text-gray-400" />
                    {uploadFile ? (
                      <p className="text-blue-600">{uploadFile.name}</p>
                    ) : (
                      <>
                        <p className="text-gray-600">
                          클릭하여 파일을 선택하거나
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          드래그 앤 드롭으로 업로드
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  업로드
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
