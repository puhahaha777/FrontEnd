import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Zap,
  Trophy,
  Target,
  Clock,
  Eye,
  Loader2,
  ChevronLeft,
  Sparkles,
  Video,
} from "lucide-react";
import { Header, type Page } from "./Header";
import {
  fetchVideoDetail,
  type VideoInfo,
  type MatchSummary,
  type ApiTimelineEvent,
} from "../api/videoApi";

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

interface VideoPlayerPageProps {
  videoId: string;
  onBack: () => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

interface Highlight {
  id: string;
  type: "score" | "rally" | "smash";
  time: number;
  label: string;
  description: string;
}

type VideoMode = "original" | "analyzed";

// ─────────────────────────────────────────────────────────────
// ★ 목업 데이터 (백엔드 연동 전 AI 분석 영상 테스트용)
//
// 백엔드 VideoDetailResponse.data.videoInfo 에
//   originalVideoUrl / analyzedVideoUrl 필드가 추가되면
//   ── MOCK START ~ MOCK END 블록을 삭제하고
//   실제 API 값을 사용하세요.
// ─────────────────────────────────────────────────────────────

/** ── MOCK START ─────────────────────────────────────────────
 * 공개 샘플 영상 두 개를 원본/분석 영상으로 사용합니다.
 * 실제 스켈레톤 분석 영상 URL로 교체하거나, 연동 완료 후 제거하세요.
 */
const MOCK_ORIGINAL_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const MOCK_ANALYZED_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
/** ── MOCK END ───────────────────────────────────────────────*/

// ─────────────────────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────────────────────

export function VideoPlayerPage({
  videoId,
  onBack,
  onNavigate,
  onLogout,
}: VideoPlayerPageProps) {
  // ── 재생 상태 ────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "score" | "rally" | "smash"
  >("all");

  // ── Dual Video ───────────────────────────────────────────────
  const [videoMode, setVideoMode] = useState<VideoMode>("original");
  const [analyzedReady, setAnalyzedReady] = useState(false);

  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const analyzedVideoRef = useRef<HTMLVideoElement>(null);
  const activeVideoRef =
    videoMode === "original" ? originalVideoRef : analyzedVideoRef;

  // ─────────────────────────────────────────────────────────────
  // ★ Duration 분리 관리 (진행바 범위 초과 버그 방지)
  //
  // 원본/분석 영상의 duration을 각각 독립 state로 관리.
  // AI 분석 영상은 원본보다 길면 안 되므로,
  // analyzedDuration 은 항상 originalDuration 이하로 클램핑한다.
  // ─────────────────────────────────────────────────────────────
  const [originalDuration, setOriginalDuration] = useState(0);
  const [rawAnalyzedDuration, setRawAnalyzedDuration] = useState(0);

  /**
   * ★ AI 분석 영상의 실효 duration.
   * 원본보다 길 수 없음 — 원본 duration을 상한으로 클램핑.
   * (목업 영상이 원본보다 길어도 진행바·시간 표시가 원본 범위 내로 유지됨)
   */
  const analyzedDuration =
    originalDuration > 0 && rawAnalyzedDuration > originalDuration
      ? originalDuration
      : rawAnalyzedDuration;

  /** 현재 활성 영상의 duration */
  const activeDuration =
    videoMode === "original" ? originalDuration : analyzedDuration;

  // ── 꾹 누르기 (2배속) ────────────────────────────────────────
  const [isSpeedUp, setIsSpeedUp] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);
  const preventClick = useRef(false);

  // ── 배속 메뉴 ────────────────────────────────────────────────
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // ── 프로그레스 바 ─────────────────────────────────────────────
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // ── API 데이터 ───────────────────────────────────────────────
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null);
  const [timelineEventsState, setTimelineEventsState] = useState<
    ApiTimelineEvent[]
  >([]);

  // ── 영상 URL 결정 ─────────────────────────────────────────────
  /**
   * TODO: 백엔드 DTO 연동 후 아래 두 줄로 교체하고 MOCK 상수 삭제
   *   const originalVideoUrl = videoInfo?.originalVideoUrl ?? null;
   *   const analyzedVideoUrl = videoInfo?.analyzedVideoUrl ?? null;
   */
  /** ── MOCK 주입 (백엔드 연동 전 임시) — 연동 후 아래 두 줄 삭제 */
  const originalVideoUrl: string | null =
    videoInfo?.videoUrl ?? MOCK_ORIGINAL_URL;
  const analyzedVideoUrl: string | null =
    videoInfo?.skeletonVideoUrl || MOCK_ANALYZED_URL;
  /** ── MOCK END ── */

  const isAnalysisAvailable = !!analyzedVideoUrl;

  // ─────────────────────────────────────────────────────────────
  // API 로드
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    fetchVideoDetail(videoId)
      .then((data) => {
        if (!mounted) return;
        setVideoInfo(data.videoInfo);
        setMatchSummary(data.matchSummary);
        setTimelineEventsState(data.timelineEvents || []);
        if (data.videoInfo?.duration)
          setOriginalDuration(data.videoInfo.duration);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "데이터를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [videoId]);

  // ─────────────────────────────────────────────────────────────
  // ★ 심리스 토글 — currentTime·rate·paused 즉시 동기화
  // ─────────────────────────────────────────────────────────────

  const switchVideoMode = useCallback(
    (nextMode: VideoMode) => {
      const fromRef =
        videoMode === "original" ? originalVideoRef : analyzedVideoRef;
      const toRef =
        nextMode === "original" ? originalVideoRef : analyzedVideoRef;

      if (!fromRef.current || !toRef.current) return;

      const snapshotTime = fromRef.current.currentTime;
      const snapshotRate = fromRef.current.playbackRate;
      const wasActuallyPlaying = !fromRef.current.paused;

      fromRef.current.pause();

      // ★ 대상 영상 duration으로 클램핑 (분석 영상이 짧을 경우 대비)
      const targetDur = toRef.current.duration || 0;
      const clamped =
        targetDur > 0 ? Math.min(snapshotTime, targetDur) : snapshotTime;

      toRef.current.currentTime = clamped;
      toRef.current.playbackRate = snapshotRate;
      setCurrentTime(clamped);

      if (wasActuallyPlaying) {
        if (nextMode === "original") {
          toRef.current.play().catch(() => {});
        } else if (analyzedReady) {
          toRef.current.play().catch(() => {});
        }
      }

      setVideoMode(nextMode);
    },
    [videoMode, analyzedReady],
  );

  const handleToggle = () => {
    if (!isAnalysisAvailable) return;
    switchVideoMode(videoMode === "original" ? "analyzed" : "original");
  };

  // ─────────────────────────────────────────────────────────────
  // 통합 재생 컨트롤
  // ─────────────────────────────────────────────────────────────

  const syncBothVideos = useCallback(
    (action: (el: HTMLVideoElement) => void) => {
      [originalVideoRef, analyzedVideoRef].forEach((ref) => {
        if (ref.current) action(ref.current);
      });
    },
    [],
  );

  const togglePlay = () => {
    if (preventClick.current) return;
    const active = activeVideoRef.current;
    if (!active) return;
    if (isPlaying) {
      syncBothVideos((el) => el.pause());
    } else {
      active.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleVideoPointerDown = () => {
    preventClick.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      preventClick.current = true;
      setIsSpeedUp(true);
      syncBothVideos((el) => {
        el.playbackRate = 2.0;
      });
      if (!isPlaying && activeVideoRef.current) {
        activeVideoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 300);
  };

  const handleVideoPointerUpOrLeave = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isLongPressing.current) {
      isLongPressing.current = false;
      setIsSpeedUp(false);
      syncBothVideos((el) => {
        el.playbackRate = playbackRate;
      });
      setTimeout(() => {
        preventClick.current = false;
      }, 50);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    syncBothVideos((el) => {
      el.playbackRate = rate;
    });
    setShowSpeedMenu(false);
  };

  const handleSkip = (amount: number) => {
    const active = activeVideoRef.current;
    if (!active) return;
    const eff = activeDuration || active.duration;
    const newTime = Math.max(0, Math.min(active.currentTime + amount, eff));
    syncBothVideos((el) => {
      el.currentTime = newTime;
    });
    setCurrentTime(newTime);
  };

  const handleJumpTo = (time: number) => {
    const clamped = activeDuration > 0 ? Math.min(time, activeDuration) : time;
    setCurrentTime(clamped);
    syncBothVideos((el) => {
      el.currentTime = clamped;
    });
    if (activeVideoRef.current) {
      activeVideoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // ── 프로그레스 바 드래그 ─────────────────────────────────────

  const calculateTimeFromMouse = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current || !activeDuration) return 0;
      const rect = progressBarRef.current.getBoundingClientRect();
      return (
        Math.max(0, Math.min((clientX - rect.left) / rect.width, 1)) *
        activeDuration
      );
    },
    [activeDuration],
  );

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !activeDuration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    setHoverPosition(pct * 100);
    setHoverTime(pct * activeDuration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setWasPlaying(isPlaying);
    syncBothVideos((el) => el.pause());
    setIsPlaying(false);
    const newTime = calculateTimeFromMouse(e.clientX);
    setCurrentTime(newTime);
    syncBothVideos((el) => {
      el.currentTime = newTime;
    });
    if (progressBarRef.current && activeDuration) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min((e.clientX - rect.left) / rect.width, 1),
      );
      setHoverPosition(pct * 100);
      setHoverTime(pct * activeDuration);
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newTime = calculateTimeFromMouse(e.clientX);
      setCurrentTime(newTime);
      syncBothVideos((el) => {
        el.currentTime = newTime;
      });
      if (progressBarRef.current && activeDuration) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const pct = Math.max(
          0,
          Math.min((e.clientX - rect.left) / rect.width, 1),
        );
        setHoverPosition(pct * 100);
        setHoverTime(pct * activeDuration);
      }
    },
    [isDragging, calculateTimeFromMouse, activeDuration, syncBothVideos],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (wasPlaying && activeVideoRef.current) {
      activeVideoRef.current.play();
      setIsPlaying(true);
    }
  }, [isDragging, wasPlaying, activeVideoRef]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      switch (e.key) {
        case "ArrowLeft":
          handleSkip(-10);
          break;
        case "ArrowRight":
          handleSkip(10);
          break;
        case " ":
          e.preventDefault();
          togglePlay();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // ─────────────────────────────────────────────────────────────
  // 유틸리티
  // ─────────────────────────────────────────────────────────────

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const total = Math.floor(s);
    const m = Math.floor(total / 60);
    const sec = total % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const getHighlightCategory = (
    type: string,
  ): "score" | "rally" | "smash" | "default" => {
    switch (type) {
      case "득점":
        return "score";
      case "랠리":
        return "rally";
      case "스매시":
        return "smash";
      default:
        return "default";
    }
  };

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case "score":
        return <Trophy className="size-3.5" />;
      case "rally":
        return <Target className="size-3.5" />;
      case "smash":
        return <Zap className="size-3.5" />;
      default:
        return <Clock className="size-3.5" />;
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "score":
        return {
          dot: "bg-amber-400",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          icon: "text-amber-500",
        };
      case "rally":
        return {
          dot: "bg-violet-400",
          badge: "bg-violet-50 text-violet-700 border-violet-200",
          icon: "text-violet-500",
        };
      case "smash":
        return {
          dot: "bg-rose-400",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          icon: "text-rose-500",
        };
      default:
        return {
          dot: "bg-sky-400",
          badge: "bg-sky-50 text-sky-700 border-sky-200",
          icon: "text-sky-500",
        };
    }
  };

  const getProgressMarkerColor = (type: string) => {
    switch (type) {
      case "score":
        return "bg-amber-400";
      case "rally":
        return "bg-violet-400";
      case "smash":
        return "bg-rose-400";
      default:
        return "bg-sky-400";
    }
  };

  const derivedHighlights = useMemo(() => {
    return timelineEventsState
      .map((e) => {
        const category = getHighlightCategory(e.type);
        if (category === "default") return null;
        return {
          id: String(e.eventId ?? e.timestamp / 1000),
          type: category,
          time: e.timestamp / 1000, // ms → s
          label: e.title || e.type,
          description: e.description || "",
        } as Highlight;
      })
      .filter(Boolean) as Highlight[];
  }, [timelineEventsState]);

  const filteredTimelineEvents = timelineEventsState.filter((e) => {
    if (activeFilter === "all") return true;
    return getHighlightCategory(e.type) === activeFilter;
  });

  const scoreLeft = matchSummary?.matchScore?.split(":")[0] ?? "-";
  const scoreRight = matchSummary?.matchScore?.split(":")[1] ?? "-";

  // 진행 퍼센트 (0~100, 절대 초과 안 함)
  const progressPct =
    activeDuration > 0
      ? Math.min((currentTime / activeDuration) * 100, 100)
      : 0;

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentPage="video"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={true}
      />

      <div className="container mx-auto px-6 py-6">
        {/* ── 페이지 헤더 ───────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all shadow-sm"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
              RallyTrack / 영상 분석
            </p>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              {videoInfo?.title ?? "영상 불러오는 중..."}
            </h1>
          </div>
        </div>

        {/* ── 메인 그리드 ───────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* ══════════════════════════════════════════════════════
              1) 좌측: 영상 + 컨트롤
             ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* ── 영상 박스 상단 헤더 (제목 레이블 + 토글) ──────── */}
            <div className="flex items-center justify-between px-1">
              {/* 현재 모드 레이블 */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    videoMode === "analyzed" ? "bg-amber-400" : "bg-emerald-400"
                  } shadow-sm`}
                />
                <span className="text-sm font-semibold text-gray-600">
                  {videoMode === "analyzed" ? "AI 분석 영상" : "원본 영상"}
                </span>
              </div>

              {/* ★ AI 분석 토글 — 영상 박스 바로 위 우측 */}
              <div className="relative group">
                <button
                  onClick={handleToggle}
                  disabled={!isAnalysisAvailable}
                  aria-label={
                    !isAnalysisAvailable
                      ? "AI 분석 진행 중..."
                      : videoMode === "original"
                        ? "AI 분석 영상으로 전환"
                        : "원본 영상으로 전환"
                  }
                  className={`
                    flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full
                    text-xs font-semibold border transition-all duration-200 select-none
                    ${
                      !isAnalysisAvailable
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        : videoMode === "analyzed"
                          ? "bg-amber-400 border-amber-300 text-amber-900 shadow-md shadow-amber-200/50 hover:bg-amber-300"
                          : "bg-white border-gray-200 text-gray-600 shadow-sm hover:border-gray-300 hover:shadow"
                    }
                  `}
                >
                  {/* 토글 트랙 */}
                  <span
                    className={`
                      relative inline-flex w-8 h-4 rounded-full transition-all duration-300 flex-shrink-0
                      ${
                        !isAnalysisAvailable
                          ? "bg-gray-200"
                          : videoMode === "analyzed"
                            ? "bg-amber-700/60"
                            : "bg-gray-200"
                      }
                    `}
                  >
                    <span
                      className={`
                        absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow
                        transition-transform duration-300
                        ${videoMode === "analyzed" ? "translate-x-4" : "translate-x-0"}
                      `}
                    />
                  </span>

                  {!isAnalysisAvailable ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      <span>분석 중</span>
                    </>
                  ) : videoMode === "analyzed" ? (
                    <>
                      <Sparkles className="size-3" />
                      <span>AI Analysis</span>
                    </>
                  ) : (
                    <>
                      <Video className="size-3" />
                      <span>Original</span>
                    </>
                  )}
                </button>

                {/* 비활성화 툴팁 */}
                {!isAnalysisAvailable && (
                  <div className="absolute right-0 top-full mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="size-3 animate-spin text-amber-400" />
                        AI 분석 진행 중입니다. 잠시 후 이용 가능합니다.
                      </div>
                      <div className="absolute right-5 -top-1 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 영상 컨테이너 ─────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden aspect-video shadow-lg relative bg-[#111]">
              {isLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                  <span className="text-white/50 text-xs">불러오는 중...</span>
                </div>
              ) : error ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                </div>
              ) : (
                <>
                  {/* 원본 영상 */}
                  <video
                    ref={originalVideoRef}
                    src={originalVideoUrl ?? undefined}
                    className={`absolute inset-0 w-full h-full object-contain cursor-pointer transition-opacity duration-200 ${
                      videoMode === "original"
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0 pointer-events-none"
                    }`}
                    onTimeUpdate={(e) => {
                      if (videoMode === "original" && !isDragging)
                        setCurrentTime(e.currentTarget.currentTime);
                    }}
                    onLoadedMetadata={(e) => {
                      // ★ 원본 duration 전용 setter
                      setOriginalDuration(e.currentTarget.duration);
                    }}
                    onPlay={() => {
                      if (videoMode === "original") setIsPlaying(true);
                    }}
                    onPause={() => {
                      if (videoMode === "original") setIsPlaying(false);
                    }}
                    onClick={togglePlay}
                    onPointerDown={handleVideoPointerDown}
                    onPointerUp={handleVideoPointerUpOrLeave}
                    onPointerLeave={handleVideoPointerUpOrLeave}
                  />

                  {/* AI 분석 영상 */}
                  <video
                    ref={analyzedVideoRef}
                    src={analyzedVideoUrl ?? undefined}
                    className={`absolute inset-0 w-full h-full object-contain cursor-pointer transition-opacity duration-200 ${
                      videoMode === "analyzed"
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0 pointer-events-none"
                    }`}
                    onTimeUpdate={(e) => {
                      if (videoMode === "analyzed" && !isDragging)
                        setCurrentTime(e.currentTarget.currentTime);
                    }}
                    onLoadedMetadata={(e) => {
                      // ★ 분석 영상 raw duration 저장 (이후 원본 기준으로 클램핑됨)
                      setRawAnalyzedDuration(e.currentTarget.duration);
                    }}
                    onCanPlay={() => {
                      setAnalyzedReady(true);
                      if (videoMode === "analyzed" && isPlaying) {
                        analyzedVideoRef.current?.play().catch(() => {});
                      }
                    }}
                    onPlay={() => {
                      if (videoMode === "analyzed") setIsPlaying(true);
                    }}
                    onPause={() => {
                      if (videoMode === "analyzed") setIsPlaying(false);
                    }}
                    onClick={togglePlay}
                    onPointerDown={handleVideoPointerDown}
                    onPointerUp={handleVideoPointerUpOrLeave}
                    onPointerLeave={handleVideoPointerUpOrLeave}
                  />

                  {/* 2배속 배지 */}
                  {isSpeedUp && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 pointer-events-none z-50">
                      <SkipForward className="size-3.5" />
                      <span className="text-xs font-bold tracking-wide">
                        2× 재생
                      </span>
                    </div>
                  )}

                  {/* AI 모드 워터마크 */}
                  {videoMode === "analyzed" && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-amber-400/90 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-none z-20">
                      <Sparkles className="size-3 text-amber-900" />
                      <span className="text-xs font-bold text-amber-900">
                        AI Analysis
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── 컨트롤 패널 ───────────────────────────────────── */}
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
              {/* 시간 + 프로그레스 바 */}
              <div className="mb-4">
                {/* 시간 */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-medium text-gray-500 tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-xs font-mono text-gray-300 tabular-nums">
                    {formatTime(activeDuration)}
                  </span>
                </div>

                {/* 프로그레스 바 */}
                <div
                  ref={progressBarRef}
                  className="relative h-1.5 rounded-full cursor-pointer group"
                  style={{ backgroundColor: "#E5E7EB" }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleProgressMouseMove}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  {/* hover 툴팁 */}
                  {isHovering && activeDuration > 0 && (
                    <div
                      className="absolute -top-8 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md pointer-events-none z-10 font-mono shadow-lg"
                      style={{ left: `${hoverPosition}%` }}
                    >
                      {formatTime(hoverTime)}
                    </div>
                  )}

                  {/* 버퍼 트랙 (시각적 depth) */}
                  <div className="absolute inset-0 rounded-full bg-gray-200" />

                  {/* 진행 게이지 */}
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-none"
                    style={{
                      width: `${progressPct}%`,
                      background:
                        videoMode === "analyzed"
                          ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                          : "linear-gradient(90deg, #3b82f6, #60a5fa)",
                    }}
                  />

                  {/* 드래그 핸들 (hover 시 표시) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      left: `${progressPct}%`,
                      borderColor:
                        videoMode === "analyzed" ? "#f59e0b" : "#3b82f6",
                    }}
                  />

                  {/* 하이라이트 마커 */}
                  {derivedHighlights.map((h, idx) => (
                    <div
                      key={h.id || idx}
                      className={`absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full pointer-events-none ${getProgressMarkerColor(h.type)}`}
                      style={{
                        left: `${activeDuration > 0 ? (h.time / activeDuration) * 100 : 0}%`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 재생 컨트롤 */}
              <div className="flex items-center justify-between">
                {/* 좌측 빈 영역 (균형) */}
                <div className="w-28" />

                {/* 중앙: 재생 컨트롤 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSkip(-10)}
                    className="flex flex-col items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                    title="-10초"
                  >
                    <SkipBack className="size-5" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="flex items-center justify-center w-12 h-12 rounded-2xl text-white transition-all active:scale-95 shadow-md"
                    style={{
                      background:
                        videoMode === "analyzed"
                          ? "linear-gradient(135deg, #f59e0b, #d97706)"
                          : "linear-gradient(135deg, #3b82f6, #2563eb)",
                      boxShadow:
                        videoMode === "analyzed"
                          ? "0 4px 14px rgba(245,158,11,0.35)"
                          : "0 4px 14px rgba(59,130,246,0.35)",
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="size-5" />
                    ) : (
                      <Play className="size-5 translate-x-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSkip(10)}
                    className="flex flex-col items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                    title="+10초"
                  >
                    <SkipForward className="size-5" />
                  </button>
                </div>

                {/* 우측: 배속 */}
                <div className="relative w-28 flex justify-end">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="text-xs font-bold text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all tabular-nums"
                  >
                    {isSpeedUp
                      ? "2.0×"
                      : `${playbackRate === 1 ? "1.0" : playbackRate}×`}
                  </button>

                  {showSpeedMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowSpeedMenu(false)}
                      />
                      <div className="absolute bottom-full right-0 mb-2 w-24 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                        <div className="py-1">
                          {[2.0, 1.5, 1.25, 1.0, 0.75, 0.5].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => handlePlaybackRateChange(rate)}
                              className={`w-full px-3 py-2 text-xs text-left font-semibold transition-colors tabular-nums ${
                                playbackRate === rate
                                  ? "bg-blue-50 text-blue-600"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {rate === 1.0 ? "보통 (1×)" : `${rate}×`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* 좌측 끝 */}

          {/* ══════════════════════════════════════════════════════
              2) 우측: 스코어 + 타임라인
             ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-1">
            <div
              className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden"
              style={{ minHeight: "600px" }}
            >
              {/* ── 스코어 섹션 ──────────────────────────────────── */}
              <div className="px-6 pt-6 pb-5 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-4">
                  매치 스코어
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-4xl font-black text-gray-900 tabular-nums leading-none">
                      {scoreLeft}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      Player A
                    </span>
                  </div>
                  <span className="text-xl font-light text-gray-200 pb-4">
                    :
                  </span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-4xl font-black text-gray-900 tabular-nums leading-none">
                      {scoreRight}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      Player B
                    </span>
                  </div>
                </div>
              </div>

              {/* ── 타임라인 섹션 ─────────────────────────────────── */}
              <div className="flex flex-col flex-1 min-h-0">
                {/* 타임라인 헤더 */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.1em]">
                    타임라인
                  </h3>
                  {/* 필터 탭 */}
                  <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                    {(["all", "score", "rally", "smash"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                          activeFilter === f
                            ? "bg-white text-gray-800 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {f === "all"
                          ? "전체"
                          : f === "score"
                            ? "득점"
                            : f === "rally"
                              ? "랠리"
                              : "스매시"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 이벤트 목록 */}
                <div className="flex-1 overflow-y-auto px-3 pb-4">
                  {filteredTimelineEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Clock className="size-4 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">
                        이벤트가 없습니다
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredTimelineEvents.map((event, idx) => {
                        const category = getHighlightCategory(event.type);
                        const style = getCategoryStyle(category);
                        const isActive =
                          activeDuration > 0 &&
                          Math.abs(currentTime - event.timestamp / 1000) < 2;

                        return (
                          <button
                            key={event.eventId ?? idx}
                            onClick={() => handleJumpTo(event.timestamp / 1000)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                              isActive
                                ? "bg-blue-50 border border-blue-100"
                                : "hover:bg-gray-50 border border-transparent"
                            }`}
                          >
                            {/* 아이콘 */}
                            <span
                              className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border ${style.badge} ${style.icon}`}
                            >
                              {getHighlightIcon(category)}
                            </span>

                            {/* 내용 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-gray-800 truncate">
                                  {event.title || event.type}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400 flex-shrink-0 tabular-nums">
                                  {event.displayTime ||
                                    formatTime(event.timestamp / 1000)}
                                </span>
                              </div>
                              {event.description && (
                                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                  {event.description}
                                </p>
                              )}
                            </div>

                            {/* 재생 화살표 */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-5 h-5 rounded-full bg-gray-900/8 flex items-center justify-center">
                                <Play className="size-2.5 text-gray-500 translate-x-px" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {/* 타임라인 끝 */}
            </div>
          </div>
          {/* 우측 끝 */}
        </div>
        {/* 그리드 끝 */}
      </div>
    </div>
  );
}
