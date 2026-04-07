import { useState, useEffect, useCallback, useRef } from "react";
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
  RotateCcw,
  CheckCircle2,
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

/* ─────────────────────────────────────────
   타입
───────────────────────────────────────── */
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

interface Point {
  x: number;
  y: number;
}

/* ─────────────────────────────────────────
   6점 라벨 정의
───────────────────────────────────────── */
const POINT_GUIDES = [
  { label: "Top Left",        shortLabel: "TL",   color: "#3B82F6",  netPoint: false },
  { label: "Top Right",       shortLabel: "TR",   color: "#10B981",  netPoint: false },
  { label: "Bottom Left",     shortLabel: "BL",   color: "#F59E0B",  netPoint: false },
  { label: "Bottom Right",    shortLabel: "BR",   color: "#EC4899",  netPoint: false },
  { label: "Net Left Post",   shortLabel: "NL",   color: "#8B5CF6",  netPoint: true  },
  { label: "Net Right Post",  shortLabel: "NR",   color: "#EF4444",  netPoint: true  },
];

/* 모달 단계 */
type ModalStep = "upload" | "frame" | "corners";

/* ─────────────────────────────────────────
   스파크라인
───────────────────────────────────────── */
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
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
      {(() => {
        const last = data[data.length - 1];
        const x = w;
        const y = h - ((last - min) / range) * (h - 6) - 3;
        return <circle cx={x} cy={y} r="3" fill={color} />;
      })()}
    </svg>
  );
}

/* ─────────────────────────────────────────
   상수 데이터
───────────────────────────────────────── */
const BADMINTON_TIPS = [
  { icon: "🏸", title: "스매시 파워업",  desc: "임팩트 순간 손목 스냅을 극대화하면 셔틀 속도가 15~20% 향상됩니다." },
  { icon: "👣", title: "풋워크 기초",    desc: "리턴 기준 위치(센터)로 빠르게 복귀하는 습관이 수비력을 크게 높입니다." },
  { icon: "🎯", title: "드롭샷 전략",    desc: "네트 근처 빈 공간을 노리는 드롭은 상대 체력 소모에 효과적입니다." },
  { icon: "💪", title: "코어 강화",      desc: "복근·허리 근력 강화로 스윙 안정성과 부상 방지 두 마리를 잡으세요." },
  { icon: "👁️", title: "셔틀 예측",     desc: "상대 라켓 각도와 어깨 방향을 읽으면 0.1초 먼저 움직일 수 있습니다." },
  { icon: "🌬️", title: "호흡 관리",     desc: "스트로크 직전 짧게 내쉬는 호흡이 근육 긴장을 줄이고 정확도를 높입니다." },
];

const MOCK_TREND = {
  smash:    [62, 68, 65, 72, 70, 75, 75],
  defense:  [70, 72, 75, 73, 78, 80, 88],
  accuracy: [60, 65, 63, 70, 75, 78, 80],
};

const MOCK_ACTIVITY = [
  { day: "월", usageCount: 5,  uploadCount: 1 },
  { day: "화", usageCount: 8,  uploadCount: 2 },
  { day: "수", usageCount: 4,  uploadCount: 0 },
  { day: "목", usageCount: 10, uploadCount: 3 },
  { day: "금", usageCount: 7,  uploadCount: 1 },
  { day: "토", usageCount: 12, uploadCount: 4 },
  { day: "일", usageCount: 6,  uploadCount: 1 },
];

/* ─────────────────────────────────────────
   활동 차트 카드
───────────────────────────────────────── */
function ActivityChartCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="size-4 text-blue-500" />
        <h2 className="text-sm font-bold text-gray-900">활동 통계</h2>
        <span className="ml-auto text-[10px] text-gray-400 font-mono">최근 7일 · 사용/업로드 추이</span>
      </div>
      <p className="text-xs text-gray-400 mb-5">사이트 사용 횟수와 업로드된 영상 수를 한 번에 확인할 수 있습니다.</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={MOCK_ACTIVITY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis yAxisId="left"  axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 6px 24px rgba(15,23,42,0.08)", fontSize: 12 }}
              formatter={(value: number, name: string) => {
                if (name === "usageCount")  return [`${value}회`, "사이트 사용"];
                if (name === "uploadCount") return [`${value}개`, "영상 업로드"];
                return [value, name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#64748b", paddingTop: "12px" }}
              formatter={(value) => {
                if (value === "usageCount")  return "사이트 사용 횟수";
                if (value === "uploadCount") return "업로드 영상 수";
                return value;
              }}
            />
            <Bar  yAxisId="left"  dataKey="uploadCount" name="uploadCount" radius={[8,8,0,0]} barSize={26} fill="#60a5fa" />
            <Line yAxisId="right" type="monotone" dataKey="usageCount" name="usageCount" stroke="#2563eb" strokeWidth={3} dot={{ r:4, fill:"#2563eb" }} activeDot={{ r:5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">총 사이트 사용</p>
          <p className="text-lg font-black text-blue-700">{MOCK_ACTIVITY.reduce((s, i) => s + i.usageCount, 0)}회</p>
        </div>
        <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3">
          <p className="text-[11px] font-bold text-sky-500 uppercase tracking-widest mb-1">총 업로드 수</p>
          <p className="text-lg font-black text-sky-700">{MOCK_ACTIVITY.reduce((s, i) => s + i.uploadCount, 0)}개</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   스텝 인디케이터
───────────────────────────────────────── */
function StepIndicator({ step }: { step: ModalStep }) {
  const steps: { key: ModalStep; label: string }[] = [
    { key: "upload",  label: "영상 선택"   },
    { key: "frame",   label: "프레임 선택" },
    { key: "corners", label: "좌표 지정"   },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-0 mb-1">
      {steps.map((s, i) => {
        const done    = i < currentIdx;
        const active  = i === currentIdx;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done   ? "bg-green-500 border-green-500 text-white"
                  : active ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {done ? <CheckCircle2 className="size-4" /> : i + 1}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${active ? "text-blue-600" : done ? "text-green-600" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 mb-4 mx-1 rounded-full transition-all ${done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   메인 컴포넌트
═══════════════════════════════════════════════════════ */
export function DashboardPage({
  onLogout,
  onViewVideo,
  onViewReport,
  onNavigate,
  hasSelectedVideo,
  user,
}: DashboardPageProps) {
  /* ── 대시보드 상태 ── */
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [tipIndex, setTipIndex]               = useState(0);
  const [stats, setStats]                     = useState<DashboardResponse["data"]["dashboardSummary"] | null>(null);
  const [videos, setVideos]                   = useState<any[]>([]);

  /* ── 모달 단계 ── */
  const [modalStep, setModalStep] = useState<ModalStep>("upload");

  /* ── 업로드 단계 상태 ── */
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [videoName, setVideoName]   = useState("");
  const [isDragging, setIsDragging] = useState(false);

  /* ── 프레임 선택 단계 상태 ── */
  const [frameIndex, setFrameIndex]   = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [fps, setFps]                 = useState(30);
  const [videoSize, setVideoSize]     = useState({ w: 0, h: 0 });
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null); // 캡처된 프레임

  /* ── 좌표 지정 단계 상태 ── */
  const [points, setPoints]             = useState<Point[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);

  /* ── Refs ── */
  const videoRef      = useRef<HTMLVideoElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);  // 프레임 추출용 (숨김)
  const cornerImgRef  = useRef<HTMLImageElement>(null);    // 좌표 지정용 이미지
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // 좌표 오버레이용
  const videoUrlRef   = useRef<string | null>(null);

  /* ─────────────────────────────────────────
     대시보드 데이터 패치
  ───────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      const json = await fetchDashboard();
      setStats(json.data.dashboardSummary);
      setVideos(
        json.data.recentVideos.map((v) => ({
          id:        String(v.videoId),
          name:      v.title,
          date:      v.date,
          duration:  v.playTime || "00:00",
          score:     v.matchScore,
          thumbnail: v.thumbnailUrl,
          status:    v.playTime === "분석 중" ? "processing" : "completed",
        })),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const iv = setInterval(() => setTipIndex((i) => (i + 1) % BADMINTON_TIPS.length), 6000);
    return () => clearInterval(iv);
  }, []);

  const hasProcessingVideo = videos.some((v) => v.status === "processing" || v.duration === "분석 중");
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasProcessingVideo) interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [hasProcessingVideo, fetchData]);

  /* ─────────────────────────────────────────
     영상 삭제
  ───────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    if (id.startsWith("temp-")) { setVideos((p) => p.filter((v) => v.id !== id)); return; }
    if (confirm("이 영상을 삭제하시겠습니까?")) {
      try {
        await deleteVideo(id);
        setVideos((p) => p.filter((v) => v.id !== id));
        if (stats) setStats({ ...stats, totalVideos: Math.max(0, stats.totalVideos - 1) });
      } catch (e) {
        alert("삭제 중 오류가 발생했습니다.");
        console.error(e);
      }
    }
  };

  /* ─────────────────────────────────────────
     영상 메타데이터 로드 (프레임 선택 단계)
  ───────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || modalStep !== "frame") return;
    const onLoaded = () => {
      setFps(30);
      const tf = Math.floor(video.duration * 30);
      setTotalFrames(tf);
      setVideoSize({ w: video.videoWidth, h: video.videoHeight });
      // 첫 프레임 자동 seek
      video.currentTime = 0;
    };
    video.addEventListener("loadedmetadata", onLoaded);
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [modalStep]);

  /* 슬라이더 → seek → 프레임 미리보기 */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || totalFrames === 0 || modalStep !== "frame") return;
    video.currentTime = frameIndex / fps;
    const onSeeked = () => {
      const canvas = frameCanvasRef.current;
      if (!canvas) return;
      canvas.width  = video.videoWidth  || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedDataUrl(canvas.toDataURL("image/jpeg", 0.92));
      }
    };
    video.addEventListener("seeked", onSeeked);
    return () => video.removeEventListener("seeked", onSeeked);
  }, [frameIndex, fps, totalFrames, modalStep]);

  /* ─────────────────────────────────────────
     오버레이 캔버스 드로우 (좌표 지정 단계)
  ───────────────────────────────────────── */
  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const img    = cornerImgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 이미지 기준 → 캔버스 스케일
    const scaleX = canvas.width  / (videoSize.w || img.naturalWidth  || canvas.width);
    const scaleY = canvas.height / (videoSize.h || img.naturalHeight || canvas.height);

    /* 코트 사각형: points[0~3] */
    if (points.length >= 4) {
      ctx.beginPath();
      ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY);
      ctx.lineTo(points[1].x * scaleX, points[1].y * scaleY);
      ctx.lineTo(points[3].x * scaleX, points[3].y * scaleY); // TL→TR→BR→BL 순 (TL,TR,BL,BR)
      ctx.lineTo(points[2].x * scaleX, points[2].y * scaleY);
      ctx.closePath();
      ctx.strokeStyle = "rgba(59,130,246,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.fillStyle = "rgba(59,130,246,0.07)";
      ctx.fill();
      ctx.setLineDash([]);
    }

    /* 네트 선분: points[4~5] */
    if (points.length >= 6) {
      ctx.beginPath();
      ctx.moveTo(points[4].x * scaleX, points[4].y * scaleY);
      ctx.lineTo(points[5].x * scaleX, points[5].y * scaleY);
      ctx.strokeStyle = "rgba(239,68,68,0.95)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    /* 각 점 마커 */
    points.forEach((pt, i) => {
      const g  = POINT_GUIDES[i];
      const cx = pt.x * scaleX;
      const cy = pt.y * scaleY;
      // 외부 원
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = g.color + "33"; ctx.fill();
      // 내부 점
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = g.color; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
      // 라벨
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(g.shortLabel, cx, cy);
    });
  }, [points, videoSize]);

  useEffect(() => {
    if (modalStep === "corners") drawOverlay();
  }, [points, modalStep, drawOverlay]);

  /* ─────────────────────────────────────────
     6점 완료 시 썸네일 Blob 생성
  ───────────────────────────────────────── */
  useEffect(() => {
    if (modalStep !== "corners" || points.length !== 6) {
      if (points.length < 6) setThumbnailBlob(null);
      return;
    }
    // 오버레이 캔버스를 offscreen에 합성하여 썸네일 생성
    const timer = setTimeout(() => {
      const overlayCanvas = overlayCanvasRef.current;
      if (!overlayCanvas || !capturedDataUrl) return;

      const offscreen = document.createElement("canvas");
      offscreen.width  = overlayCanvas.width;
      offscreen.height = overlayCanvas.height;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;

      const bgImg = new Image();
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, offscreen.width, offscreen.height);
        ctx.drawImage(overlayCanvas, 0, 0);
        offscreen.toBlob(
          (blob) => { if (blob) setThumbnailBlob(blob); },
          "image/jpeg",
          0.9,
        );
      };
      bgImg.src = capturedDataUrl;
    }, 100);
    return () => clearTimeout(timer);
  }, [points, modalStep, capturedDataUrl]);

  /* ─────────────────────────────────────────
     캔버스 클릭 → 좌표 수집
  ───────────────────────────────────────── */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (points.length >= 6) return;
    const canvas = overlayCanvasRef.current;
    const img    = cornerImgRef.current;
    if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = (videoSize.w || img?.naturalWidth  || rect.width)  / rect.width;
    const scaleY = (videoSize.h || img?.naturalHeight || rect.height) / rect.height;
    setPoints((prev) => [...prev, {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top)  * scaleY),
    }]);
  };

  /* ─────────────────────────────────────────
     파일 선택 → 프레임 선택 단계
  ───────────────────────────────────────── */
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) return;
    setUploadFile(file);
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    videoUrlRef.current = URL.createObjectURL(file);
    setPoints([]);
    setFrameIndex(0);
    setCapturedDataUrl(null);
    setThumbnailBlob(null);
    setSubmitResult(null);
    setModalStep("frame");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  /* ─────────────────────────────────────────
     "이 프레임 사용" → 좌표 지정 단계
  ───────────────────────────────────────── */
  const handleConfirmFrame = () => {
    // 현재 프레임 dataURL이 없으면 즉시 캡처
    if (!capturedDataUrl) {
      const video = videoRef.current;
      const canvas = frameCanvasRef.current;
      if (video && canvas) {
        canvas.width  = video.videoWidth  || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setCapturedDataUrl(canvas.toDataURL("image/jpeg", 0.92));
        }
      }
    }
    setPoints([]);
    setThumbnailBlob(null);
    setModalStep("corners");
  };

  /* ─────────────────────────────────────────
     모달 닫기
  ───────────────────────────────────────── */
  const closeModal = () => {
    setShowUploadModal(false);
    setModalStep("upload");
    setUploadFile(null);
    setVideoName("");
    setPoints([]);
    setFrameIndex(0);
    setCapturedDataUrl(null);
    setThumbnailBlob(null);
    setSubmitResult(null);
    if (videoUrlRef.current) { URL.revokeObjectURL(videoUrlRef.current); videoUrlRef.current = null; }
  };

  /* ─────────────────────────────────────────
     분석 시작: 영상 업로드 + 좌표 전송
  ───────────────────────────────────────── */
  const handleSubmit = async () => {
    if (points.length < 6 || !uploadFile) return;
    setIsSubmitting(true);
    setSubmitResult(null);

    const tempId = `temp-${Date.now()}`;
    const tempVideo: VideoRecord = {
      id: tempId,
      name: videoName || uploadFile.name,
      date: new Date().toISOString().split("T")[0],
      duration: "업로드 중...",
      status: "uploading",
      thumbnail: thumbnailBlob ? URL.createObjectURL(thumbnailBlob) : undefined,
    };
    setVideos((prev) => [tempVideo, ...prev]);
    closeModal();

    /* 1) 영상 파일 업로드 */
    let newVideoId: string | null = null;
    try {
      const formData = new FormData();
      formData.append("videoFile", uploadFile);
      formData.append("title", videoName || uploadFile.name);
      formData.append("matchDate", new Date().toISOString().split("T")[0]);
      if (thumbnailBlob) {
        formData.append("thumbnailImage", thumbnailBlob, "thumbnail.jpg");
      }

      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:8080/api/v1/videos", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("upload failed");
      const data = await res.json();
      newVideoId = String(data.videoId);

      setVideos((prev) =>
        prev.map((v) =>
          v.id === tempId
            ? { ...v, id: newVideoId!, name: data.title, duration: "분석 중", status: "processing" }
            : v,
        ),
      );
      if (stats) setStats({ ...stats, totalVideos: stats.totalVideos + 1 });
    } catch (err) {
      console.error("Upload Error:", err);
      setVideos((prev) =>
        prev.map((v) => v.id === tempId ? { ...v, duration: "업로드 실패", status: "error" } : v),
      );
    }

    /* 2) 좌표 전송 */
    const payload = {
      video_id:           newVideoId,
      frame_number:       frameIndex,
      frame_timestamp_ms: Math.round((frameIndex / fps) * 1000),
      video_filename:     uploadFile.name,
      video_fps:          fps,
      frame_width:        videoSize.w,
      frame_height:       videoSize.h,
      court_points: points.slice(0, 4).map((p, i) => ({
        index: i + 1,
        label: ["top_left", "top_right", "bottom_left", "bottom_right"][i],
        x: p.x,
        y: p.y,
      })),
      net_points: points.slice(4, 6).map((p, i) => ({
        index: i + 1,
        label: ["net_left_top", "net_right_top"][i],
        x: p.x,
        y: p.y,
      })),
      captured_at: new Date().toISOString(),
    };

    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/analysis/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Calibration Error:", err);
    }

    setIsSubmitting(false);
    setSubmitResult("success");
  };

  /* ── 팁 내비게이션 ── */
  const handlePrevTip = () => setTipIndex((p) => (p === 0 ? BADMINTON_TIPS.length - 1 : p - 1));
  const handleNextTip = () => setTipIndex((p) => (p === BADMINTON_TIPS.length - 1 ? 0 : p + 1));
  const currentTip   = BADMINTON_TIPS[tipIndex];

  /* 현재 찍어야 할 좌표 가이드 */
  const currentGuide = points.length < 6 ? POINT_GUIDES[points.length] : null;

  /* ─────────────────────────────────────────
     렌더
  ───────────────────────────────────────── */
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
        {/* 헤더 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-[0.15em] mb-1">내 경기 기록</p>
            <h1 className="text-3xl font-black text-gray-900 leading-tight">영상 대시보드</h1>
            <p className="mt-1.5 text-sm text-gray-400 font-medium">업로드한 경기 영상과 AI 분석 리포트를 관리하세요</p>
          </div>
          <button
            onClick={() => { setShowUploadModal(true); setModalStep("upload"); }}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200 text-sm font-semibold"
          >
            <Upload className="size-4" />
            영상 업로드
          </button>
        </div>

        {/* 스탯 카드 */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 mb-8">
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
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-5 group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-l-2xl" />
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 flex-shrink-0">
                <Film className="size-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">총 업로드 영상</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-gray-900 tabular-nums leading-none">{stats.totalVideos}</span>
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
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">총 영상 시간</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-gray-900 tabular-nums leading-none">{stats.totalAnalysisTime}</span>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-indigo-50 opacity-50 group-hover:opacity-80 transition-opacity" />
            </div>
          </div>
        ) : null}

        <ActivityChartCard />

        {/* 퍼포먼스 트렌드 + 팁 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="size-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-gray-900">퍼포먼스 트렌드</h2>
              <span className="ml-auto text-[10px] text-gray-400 font-mono">최근 7주 · 분석 데이터 기반</span>
            </div>
            <div className="space-y-4">
              {[
                { label: "스매시",  data: MOCK_TREND.smash,    color: "#ef4444", current: MOCK_TREND.smash[6]    },
                { label: "수비력",  data: MOCK_TREND.defense,  color: "#3b82f6", current: MOCK_TREND.defense[6]  },
                { label: "정확도",  data: MOCK_TREND.accuracy, color: "#10b981", current: MOCK_TREND.accuracy[6] },
              ].map(({ label, data, color, current }) => {
                const prev = data[data.length - 2];
                const diff = current - prev;
                return (
                  <div key={label} className="flex items-center gap-4">
                    <span className="w-14 text-xs font-semibold text-gray-500 shrink-0">{label}</span>
                    <div className="flex-1"><TrendSparkline data={data} color={color} /></div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm font-black tabular-nums" style={{ color }}>{current}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${diff >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                        {diff >= 0 ? "+" : ""}{diff}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[10px] text-gray-300 font-mono">* 트렌드는 분석된 경기 리포트 데이터를 기반으로 자동 계산됩니다.</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-gradient-to-br from-[#1a2b4c] to-[#2a4070] rounded-2xl p-5 text-white flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="size-4 text-[#8ce600]" />
                  <span className="text-[10px] font-bold text-[#8ce600] uppercase tracking-widest">오늘의 배드민턴 팁</span>
                </div>
                <div className="text-3xl mb-2">{currentTip.icon}</div>
                <p className="text-sm font-bold mb-1">{currentTip.title}</p>
                <p className="text-xs text-white/70 leading-relaxed min-h-[48px]">{currentTip.desc}</p>
                <div className="flex items-center justify-between mt-4">
                  <button type="button" onClick={handlePrevTip} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="이전 팁">
                    <ChevronLeft className="size-4 text-white" />
                  </button>
                  <div className="flex gap-1">
                    {BADMINTON_TIPS.map((_, i) => (
                      <button key={i} type="button" onClick={() => setTipIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === tipIndex ? "w-5 bg-[#8ce600]" : "w-2 bg-white/30 hover:bg-white/50"}`}
                        aria-label={`${i + 1}번째 팁`}
                      />
                    ))}
                  </div>
                  <button type="button" onClick={handleNextTip} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="다음 팁">
                    <ChevronRight className="size-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 영상 목록 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-gray-900">최근 영상</span>
              {!isLoading && videos.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold tabular-nums">{videos.length}</span>
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
              <p className="text-sm font-semibold text-gray-500 mb-1">업로드된 영상이 없습니다</p>
              <p className="text-xs text-gray-400">첫 번째 경기 영상을 업로드해보세요</p>
              <button
                onClick={() => { setShowUploadModal(true); setModalStep("upload"); }}
                className="mt-5 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
              >
                영상 업로드
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {videos.map((video) => (
                <VideoItem key={video.id} video={video} onViewVideo={onViewVideo} onViewReport={onViewReport} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* ══════════════════════════════════════════
          업로드 모달
      ══════════════════════════════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

          {/* ── STEP 1: 영상 선택 ── */}
          {modalStep === "upload" && (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                  <StepIndicator step="upload" />
                  <h2 className="text-base font-bold text-gray-900 mt-1">영상 업로드</h2>
                  <p className="text-xs text-gray-400 mt-0.5">경기 영상을 업로드하여 AI 분석을 받으세요</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                  <X className="size-4" />
                </button>
              </div>

              <div className="px-6 py-5">
                {/* 영상 이름 */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">영상 이름</label>
                  <input
                    type="text"
                    value={videoName}
                    onChange={(e) => setVideoName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 placeholder:text-gray-400"
                    placeholder="예: 주말 복식 경기"
                  />
                </div>

                {/* 드래그 앤 드롭 */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">영상 파일</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`rounded-xl border-2 border-dashed transition-all ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"}`}
                  >
                    <label htmlFor="video-upload" className="flex flex-col items-center justify-center w-full p-8 cursor-pointer">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                        className="hidden"
                        id="video-upload"
                      />
                      <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center mb-3">
                        <Plus className="size-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">클릭하여 파일 선택</p>
                      <p className="text-xs text-gray-400 mt-1">또는 드래그 앤 드롭</p>
                      <p className="text-xs text-gray-300 mt-1">MP4, MOV, AVI, MKV, WEBM</p>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: 프레임 선택 ── */}
          {modalStep === "frame" && (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden">
              {/* 모달 헤더 */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setModalStep("upload")}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 mt-1"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <div>
                    <StepIndicator step="frame" />
                    <h2 className="text-base font-bold text-gray-900">프레임 선택</h2>
                    <p className="text-xs text-gray-400">코트 라인이 선명하게 보이는 프레임을 선택하세요</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                  <X className="size-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {/* 숨겨진 video + 프레임 추출 캔버스 */}
                <video
                  ref={videoRef}
                  src={videoUrlRef.current ?? undefined}
                  className="hidden"
                  preload="auto"
                  crossOrigin="anonymous"
                />
                <canvas ref={frameCanvasRef} className="hidden" />

                {/* 프레임 미리보기 */}
                <div className="px-6 pt-4">
                  <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
                    {capturedDataUrl ? (
                      <img
                        src={capturedDataUrl}
                        alt="선택된 프레임"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
                        영상 로딩 중...
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-mono">
                      {Math.floor(frameIndex / fps / 60)}:{String(Math.floor((frameIndex / fps) % 60)).padStart(2, "0")}
                    </div>
                  </div>
                </div>

                {/* 타임라인 슬라이더 */}
                <div className="px-6 pt-4 pb-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFrameIndex((f) => Math.max(0, f - 1))}
                      disabled={frameIndex <= 0}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <div className="flex-1">
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, totalFrames - 1)}
                        value={frameIndex}
                        onChange={(e) => setFrameIndex(Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
                        <span>프레임 {frameIndex}</span>
                        <span>
                          {Math.floor(frameIndex / fps / 60)}:{String(Math.floor((frameIndex / fps) % 60)).padStart(2, "0")}
                          {" / "}
                          {totalFrames > 0
                            ? `${Math.floor(totalFrames / fps / 60)}:${String(Math.floor((totalFrames / fps) % 60)).padStart(2, "0")}`
                            : "0:00"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setFrameIndex((f) => Math.min(Math.max(0, totalFrames - 1), f + 1))}
                      disabled={frameIndex >= totalFrames - 1}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="px-6 pb-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalStep("upload")}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    ← 이전
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmFrame}
                    disabled={!capturedDataUrl}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md shadow-blue-100"
                  >
                    이 프레임 사용 →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: 코트 좌표 지정 ── */}
          {modalStep === "corners" && (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden">
              {/* 모달 헤더 */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setModalStep("frame"); setPoints([]); setThumbnailBlob(null); }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 mt-1"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <div>
                    <StepIndicator step="corners" />
                    <h2 className="text-base font-bold text-gray-900">코트 꼭짓점 지정</h2>
                    <p className="text-xs text-gray-400">썸네일 이미지에서 코트의 네 꼭짓점을 순서대로 클릭하세요</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                  <X className="size-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {/* 안내 배너 */}
                <div className="px-6 pt-4 pb-3">
                  {submitResult === "success" ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
                      <CheckCircle2 className="size-4 flex-shrink-0" />
                      <span className="text-sm font-medium">분석 요청 완료! 잠시 후 결과를 확인할 수 있습니다.</span>
                    </div>
                  ) : currentGuide ? (
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium"
                      style={{ borderColor: currentGuide.color + "55", backgroundColor: currentGuide.color + "11", color: currentGuide.color }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: currentGuide.color }} />
                      <span>
                        {points.length + 1}번 — 이미지 위에서 <strong>{currentGuide.label}</strong>을(를) 클릭하세요
                        {currentGuide.netPoint && <span className="ml-2 text-xs opacity-70 font-normal">(네트 기둥)</span>}
                      </span>
                      <span className="ml-auto text-xs opacity-60 font-normal whitespace-nowrap">{points.length} / 6</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700">
                      <CheckCircle2 className="size-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">6개 점 수집 완료! 아래 분석 시작 버튼을 눌러주세요.</p>
                        {thumbnailBlob && (
                          <div className="mt-2 flex items-center gap-2">
                            <img
                              src={URL.createObjectURL(thumbnailBlob)}
                              alt="코트 썸네일"
                              className="h-12 rounded-lg border border-blue-200 object-cover shadow-sm"
                            />
                            <span className="text-xs text-blue-500 font-medium">썸네일 자동 생성됨 ✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 진행 바 */}
                <div className="px-6 pb-3">
                  <div className="flex gap-1">
                    {POINT_GUIDES.map((g, i) => (
                      <div
                        key={i}
                        className="flex-1 h-1.5 rounded-full transition-all"
                        style={{ backgroundColor: i < points.length ? g.color : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">코트 꼭짓점 (1~4)</span>
                    <span className="text-[10px] text-gray-400">네트 기둥 (5~6)</span>
                  </div>
                </div>

                {/* 이미지 + 오버레이 캔버스 */}
                <div className="px-6">
                  <div
                    className="relative rounded-xl overflow-hidden bg-black"
                    style={{ aspectRatio: "16/9" }}
                  >
                    {capturedDataUrl && (
                      <img
                        ref={cornerImgRef}
                        src={capturedDataUrl}
                        alt="코트 프레임"
                        className="w-full h-full object-contain"
                        onLoad={() => drawOverlay()}
                      />
                    )}
                    <canvas
                      ref={overlayCanvasRef}
                      className={`absolute inset-0 w-full h-full ${points.length < 6 ? "cursor-crosshair" : "cursor-default"}`}
                      onClick={handleCanvasClick}
                    />
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-mono">
                      {points.length} / 6
                    </div>
                  </div>
                </div>

                {/* 좌표 목록 */}
                <div className="px-6 pt-4 pb-2">
                  {/* 코트 꼭짓점 */}
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">코트 꼭짓점</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {POINT_GUIDES.filter((g) => !g.netPoint).map((g, i) => (
                      <div
                        key={g.shortLabel}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border text-xs"
                        style={
                          points[i]
                            ? { borderColor: g.color + "60", backgroundColor: g.color + "0f" }
                            : { borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }
                        }
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: points[i] ? g.color : "#d1d5db" }} />
                          <span className="font-bold" style={{ color: points[i] ? g.color : "#9ca3af" }}>
                            {g.shortLabel}
                          </span>
                        </div>
                        <span className="font-mono text-gray-500">
                          {points[i] ? `(${points[i].x}, ${points[i].y})` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* 네트 기둥 */}
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">네트 기둥</p>
                  <div className="grid grid-cols-2 gap-2">
                    {POINT_GUIDES.filter((g) => g.netPoint).map((g, i) => {
                      const ptIdx = 4 + i;
                      return (
                        <div
                          key={g.shortLabel}
                          className="flex items-center justify-between px-3 py-2 rounded-lg border text-xs"
                          style={
                            points[ptIdx]
                              ? { borderColor: g.color + "60", backgroundColor: g.color + "0f" }
                              : { borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }
                          }
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: points[ptIdx] ? g.color : "#d1d5db" }} />
                            <span className="font-bold" style={{ color: points[ptIdx] ? g.color : "#9ca3af" }}>
                              {g.shortLabel}
                            </span>
                          </div>
                          <span className="font-mono text-gray-500">
                            {points[ptIdx] ? `(${points[ptIdx].x}, ${points[ptIdx].y})` : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="px-6 pb-5 pt-3 flex gap-3">
                  <button
                    onClick={() => setPoints((p) => p.slice(0, -1))}
                    disabled={points.length === 0}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    ← 이전 점
                  </button>
                  <button
                    onClick={() => { setPoints([]); setThumbnailBlob(null); }}
                    disabled={points.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <RotateCcw className="size-4" />
                    초기화
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={points.length < 6 || isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md shadow-blue-100"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Upload className="size-4" />
                        꼭짓점 {points.length}/6 지정됨
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
