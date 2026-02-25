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
  Activity,
  FileText,
  CheckSquare,
  Plus,
} from "lucide-react";
import { Header, type Page } from "./Header";
import {
  fetchVideoDetail,
  type VideoInfo,
  type MatchSummary,
  type ApiTimelineEvent,
} from "../api/videoApi";

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

interface TimelineEvent {
  time: number;
  type: string;
  description: string;
}

export function VideoPlayerPage({
  videoId,
  onBack,
  onNavigate,
  onLogout,
}: VideoPlayerPageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "score" | "rally" | "smash"
  >("all");
  const [memo, setMemo] = useState("");
  const [todoList, setTodoList] = useState([
    { id: 1, text: "스매시 타점 확인하기", completed: false },
    { id: 2, text: "백핸드 드라이브 보완", completed: true },
    { id: 3, text: "풋워크 속도 체크", completed: false },
  ]);

  // Video element Ref 및 꾹 누르기 상태 관리
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSpeedUp, setIsSpeedUp] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);
  const preventClick = useRef(false);

  const [playbackRate, setPlaybackRate] = useState(1.0); // 현재 선택된 배속
  const [showSpeedMenu, setShowSpeedMenu] = useState(false); // 배속 메뉴 팝업 표시 여부

  // 재생바 드래그 관련 상태 및 Ref 추가
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(false);

  // 재생바 hover 시간 툴팁 관련 상태 추가
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // API-driven states
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null);
  const [timelineEventsState, setTimelineEventsState] = useState<
    ApiTimelineEvent[]
  >([]);

  const [duration, setDuration] = useState(0); // 비디오 총 길이 (초 단위)

  // API 데이터가 로드되면 duration 초기값 설정 (useEffect 안에 추가)
  useEffect(() => {
    if (videoInfo?.duration) {
      // API에서 초 단위(Seconds)로 준다면 그대로 사용
      // 만약 밀리초(ms)라면 videoInfo.duration / 1000 해야 함 (보통은 초 단위)
      setDuration(videoInfo.duration);
    }
  }, [videoInfo]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00"; // 값이 없거나 NaN이면 00:00 반환

    const totalSeconds = Math.floor(seconds); // 소수점 버림
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    // 00:00 형식으로 변환 (한 자리수일 때 앞에 0 붙임)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 타임라인 이벤트 클릭 시 해당 시간으로 점프하는 로직
  const handleJumpTo = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {}); // 이동 후 바로 재생 (선택 사항)
      setIsPlaying(true);
    }
  };

  // 마우스 X 좌표를 영상 시간으로 변환하는 헬퍼 함수
  const calculateTimeFromMouse = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current || !duration) return 0;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
      return percentage * duration;
    },
    [duration],
  );

  // 재생바에 마우스를 올렸을 때 툴팁 위치와 시간 계산
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(hoverX / rect.width, 1));

    setHoverPosition(percentage * 100);
    setHoverTime(percentage * duration);
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  // 재생바 클릭 및 드래그 시작 시점
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setWasPlaying(isPlaying);

    if (videoRef.current) {
      videoRef.current.pause(); // 드래그 중 부드러운 이동을 위해 영상 일시정지
      setIsPlaying(false);
    }

    const newTime = calculateTimeFromMouse(e.clientX);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }

    // 클릭 즉시 툴팁 위치 동기화
    if (progressBarRef.current && duration) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
      setHoverPosition(percentage * 100);
      setHoverTime(percentage * duration);
    }
  };

  // 드래그 중일 때 처리
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newTime = calculateTimeFromMouse(e.clientX);
      setCurrentTime(newTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
      // 드래그 중에도 툴팁이 마우스를 따라다니도록 업데이트
      if (progressBarRef.current && duration) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const hoverX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(hoverX / rect.width, 1));
        setHoverPosition(percentage * 100);
        setHoverTime(percentage * duration);
      }
    },
    [isDragging, calculateTimeFromMouse, duration],
  );

  // 마우스 뗐을 때 (드래그 종료) 처리
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    // 드래그 시작 전에 재생 중이었다면 다시 재생
    if (wasPlaying && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isDragging, wasPlaying]);

  // 전역 마우스 이벤트 등록 (마우스가 재생바를 벗어나도 드래그 유지되도록)
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

  const togglePlay = () => {
    if (preventClick.current) return; // 꾹 누르기 직후의 클릭 무시

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 영상 꾹 누르기 시작 (2배속)
  const handleVideoPointerDown = () => {
    preventClick.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      preventClick.current = true;
      setIsSpeedUp(true);

      if (videoRef.current) {
        videoRef.current.playbackRate = 2.0; // 2배속 적용
        if (!isPlaying) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    }, 300); // 0.3초 누르면 발동
  };

  // 영상 마우스 떼기/벗어남 (원래 속도)
  const handleVideoPointerUpOrLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (isLongPressing.current) {
      isLongPressing.current = false;
      setIsSpeedUp(false);

      if (videoRef.current) {
        videoRef.current.playbackRate = playbackRate; // 원래 배속으로 복원
      }

      // 꾹 누르기 끝난 후 바로 재생/일시정지(onClick)가 발동되는 것 방지
      setTimeout(() => {
        preventClick.current = false;
      }, 50);
    }
  };

  // 배속 메뉴에서 속도 선택 시 처리 함수
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false); // 선택 후 메뉴 닫기
  };

  // 10초 앞/뒤로 건너뛰기 함수
  const handleSkip = (amount: number) => {
    if (videoRef.current) {
      const currentVideoDuration = duration || videoRef.current.duration;
      // 0초와 전체 길이 사이를 벗어나지 않도록 처리
      const newTime = Math.max(
        0,
        Math.min(videoRef.current.currentTime + amount, currentVideoDuration),
      );

      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // 유튜브처럼 키보드 단축키 지원 (좌우 방향키, 스페이스바)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 메모장(textarea)에 글씨를 입력 중일 때는 단축키가 먹히지 않도록 방지
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          handleSkip(-10);
          break;
        case "ArrowRight":
          handleSkip(10);
          break;
        case " ":
          e.preventDefault(); // 스페이스바 누를 때 화면이 아래로 내려가는 현상 방지
          togglePlay();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // 카테고리 매핑 함수
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

  const toggleTodo = (id: number) => {
    setTodoList(
      todoList.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case "score":
        return <Trophy className="size-4" />;
      case "rally":
        return <Target className="size-4" />;
      case "smash":
        return <Zap className="size-4" />;
      default:
        return <Clock className="size-4" />;
    }
  };

  const getHighlightColor = (type: string) => {
    switch (type) {
      case "score":
        return "bg-yellow-500";
      case "rally":
        return "bg-purple-500";
      case "smash":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  // 타임라인 이벤트를 하이라이트 형태로 변환하는 로직
  const derivedHighlights = useMemo(() => {
    return timelineEventsState
      .map((e) => {
        const category = getHighlightCategory(e.type);
        if (category === "default") return null;
        return {
          id: String(e.eventId ?? e.timestamp),
          type: category,
          time: e.timestamp,
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

  const scoreLeft = matchSummary?.matchScore?.split(":")[0] ?? "-";
  const scoreRight = matchSummary?.matchScore?.split(":")[1] ?? "-";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        currentPage="video"
        onNavigate={onNavigate}
        onLogout={onLogout}
        hasSelectedVideo={true}
      />

      <div className="container mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
        >
          ← 돌아가기
        </button>
        <h1 className="text-2xl font-bold mb-4">
          {videoInfo?.title ?? "영상 불러오는 중..."}
        </h1>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video shadow-lg relative">
              <div className="w-full h-full flex items-center justify-center">
                {" "}
                {/* Video Overlay */}
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/50" />
                  </div>
                ) : error ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="bg-red-600/60 text-white px-4 py-2 rounded">
                      {error}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 1. 실제 비디오 태그 추가 */}
                    <video
                      ref={videoRef}
                      src={videoInfo?.videoUrl}
                      className="w-full h-full object-contain bg-black cursor-pointer"
                      onTimeUpdate={(e) => {
                        // 드래그 중일 때는 onTimeUpdate가 currentTime을 덮어쓰지 않게 방지
                        if (!isDragging) {
                          setCurrentTime(e.currentTarget.currentTime);
                        }
                      }}
                      // 2. 영상 메타데이터 로드 시 duration 업데이트 (API 값이 없을 때 대비)
                      onLoadedMetadata={(e) => {
                        if (!videoInfo?.duration) {
                          setDuration(e.currentTarget.duration);
                        }
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onClick={togglePlay} // 화면 클릭 시 재생/일시정지
                      onPointerDown={handleVideoPointerDown}
                      onPointerUp={handleVideoPointerUpOrLeave}
                      onPointerLeave={handleVideoPointerUpOrLeave}
                    />

                    {/* 2배속 재생 안내 오버레이 */}
                    {isSpeedUp && (
                      <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white pointer-events-none animate-pulse z-50">
                        <span className="text-sm font-bold tracking-wide">
                          2배속 재생 중
                        </span>
                        <SkipForward className="size-4" />
                      </div>
                    )}

                    {/* 2. Score Overlay (비디오 위에 띄움) */}
                    <div className="absolute top-6 left-6 flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-white pointer-events-none">
                      <div className="text-center">
                        <div className="text-[10px] opacity-60 uppercase tracking-widest">
                          Team A
                        </div>
                        <div className="text-xl leading-none">{scoreLeft}</div>
                      </div>
                      <div className="text-lg opacity-40">-</div>
                      <div className="text-center">
                        <div className="text-[10px] opacity-60 uppercase tracking-widest">
                          Team B
                        </div>
                        <div className="text-xl leading-none">{scoreRight}</div>
                      </div>
                    </div>

                    {/* 3. 중앙 재생 버튼 (일시정지 상태일 때만 보임) */}
                    {!isPlaying && !isLoading && (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black/10 cursor-pointer"
                        onClick={togglePlay}
                      >
                        <Play className="size-20 text-white/50 hover:text-white/80 transition-colors" />
                      </div>
                    )}
                  </>
                )}
                {/* Heatmap overlay */}
                {showHeatmap && !isLoading && (
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full">
                      {/* Mock heatmap circles */}
                      <circle
                        cx="30%"
                        cy="40%"
                        r="60"
                        fill="rgba(255, 0, 0, 0.3)"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="80"
                        fill="rgba(255, 100, 0, 0.4)"
                      />
                      <circle
                        cx="70%"
                        cy="60%"
                        r="50"
                        fill="rgba(255, 200, 0, 0.3)"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2 font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                {/* Progress bar Container (툴팁 포함 구조로 변경) */}
                <div
                  ref={progressBarRef}
                  className="relative py-2 cursor-pointer group" // py-2를 줘서 클릭 판정(Hit Area)을 좀 더 넓혔습니다.
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleProgressMouseMove}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Tooltip */}
                  {(isHovering || isDragging) && (
                    <div
                      className="absolute -top-7 -translate-x-1/2 bg-gray-900 text-white text-[11px] font-bold px-2 py-1 rounded shadow-md z-50 pointer-events-none transition-opacity"
                      style={{ left: `${hoverPosition}%` }}
                    >
                      {formatTime(hoverTime)}
                    </div>
                  )}

                  {/* 실제 재생 바 */}
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full bg-blue-600 ${
                        isDragging
                          ? ""
                          : "transition-[width] duration-[250ms] ease-linear"
                      }`}
                      style={{
                        width: `${(duration ? currentTime / duration : 0) * 100}%`,
                      }}
                    />
                    {/* Highlight markers */}
                    {derivedHighlights.map((h, idx) => (
                      <div
                        // 혹시 모를 key 중복 방지 위해 idx 추가
                        key={h.id || idx}
                        // 마커 위에서 드래그 끊김 방지
                        className={`absolute top-0 w-1 h-full pointer-events-none ${getHighlightColor(
                          h.type,
                        )}`}
                        style={{
                          left: `${duration ? (h.time / duration) * 100 : 0}%`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Playback controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                        showHeatmap
                          ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Activity className="size-4" />
                      히트맵 {showHeatmap ? "끄기" : "켜기"}
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* 10초 뒤로 가기 버튼 */}
                    <button
                      onClick={() => handleSkip(-10)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <SkipBack className="size-6" />
                    </button>
                    <button
                      onClick={togglePlay} // 재생/일시정지 토글
                      className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                      {isPlaying ? (
                        <Pause className="size-8" />
                      ) : (
                        <Play className="size-8" />
                      )}
                    </button>
                    {/* 10초 앞으로 가기 버튼 */}
                    <button
                      onClick={() => handleSkip(10)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <SkipForward className="size-6" />
                    </button>
                  </div>

                  <div className="relative w-[120px] text-right flex justify-end">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition-all flex items-center gap-1"
                    >
                      {isSpeedUp
                        ? "2.0x Speed"
                        : `${playbackRate === 1 ? "1.0" : playbackRate}x Speed`}
                    </button>

                    {/* 배속 선택 메뉴 팝업 (위에서 아래로 높은 배속 배치) */}
                    {showSpeedMenu && (
                      <>
                        {/* 메뉴 바깥을 클릭하면 닫히도록 하는 투명 배경 */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowSpeedMenu(false)}
                        />
                        <div className="absolute bottom-full right-0 mb-2 w-28 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                          <div className="py-1 flex flex-col">
                            {[2.0, 1.75, 1.5, 1.25, 1.0, 0.75, 0.5, 0.25].map(
                              (rate) => (
                                <button
                                  key={rate}
                                  onClick={() => handlePlaybackRateChange(rate)}
                                  className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                                    playbackRate === rate
                                      ? "bg-blue-50 text-blue-600 font-bold"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {rate === 1.0 ? "보통" : `${rate}x`}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Match Memo & Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Memo Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="size-4 text-blue-600" />
                      경기 분석 메모
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      자동 저장됨
                    </span>
                  </div>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="flex-1 w-full min-h-[120px] p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
                    placeholder="영상을 보며 분석한 내용이나 개선할 점을 자유롭게 적어보세요..."
                  />
                </div>

                {/* Checklist Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <CheckSquare className="size-4 text-green-600" />
                      훈련 체크리스트
                    </h3>
                    <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                      <Plus className="size-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {todoList.map((todo) => (
                      <div
                        key={todo.id}
                        onClick={() => toggleTodo(todo.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          todo.completed
                            ? "bg-gray-50 border-transparent opacity-60"
                            : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={`size-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                            todo.completed
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-200"
                          }`}
                        >
                          {todo.completed && (
                            <CheckSquare className="size-3 text-white" />
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium transition-all ${
                            todo.completed
                              ? "text-gray-500 line-through"
                              : "text-gray-700"
                          }`}
                        >
                          {todo.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Merged Highlights & Timeline */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-160px)] sticky top-24">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    분석 타임라인
                  </h2>
                  <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    총 {derivedHighlights.length + timelineEventsState.length}개
                    구간
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {(["all", "score", "rally", "smash"] as const).map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                          activeFilter === filter
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {filter === "all"
                          ? "전체"
                          : filter === "score"
                            ? "득점"
                            : filter === "rally"
                              ? "랠리"
                              : "스매시"}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />

                    <div className="space-y-6 relative">
                      {/* Timeline Style Events */}
                      {filteredTimelineEvents.length > 0 ? (
                        filteredTimelineEvents.map((event, index) => {
                          const isHighlight = derivedHighlights.find(
                            (h) => h.time === event.timestamp,
                          );
                          return (
                            <div
                              key={index}
                              className="flex gap-4 group cursor-pointer"
                              onClick={() => handleJumpTo(event.timestamp)}
                            >
                              <div
                                className={`relative z-10 size-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-110 ${
                                  isHighlight
                                    ? getHighlightColor(isHighlight.type)
                                    : "bg-gray-200"
                                }`}
                              >
                                {isHighlight ? (
                                  <div className="text-white">
                                    {getHighlightIcon(isHighlight.type)}
                                  </div>
                                ) : (
                                  <div className="size-2 bg-gray-400 rounded-full" />
                                )}
                              </div>

                              <div className="flex-1 pb-2">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span
                                    className={`text-xs font-bold ${isHighlight ? "text-blue-600" : "text-gray-400"}`}
                                  >
                                    {formatTime(event.timestamp)}
                                  </span>
                                  {isHighlight && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold text-white uppercase ${getHighlightColor(isHighlight.type)}`}
                                    >
                                      {isHighlight.label}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm font-semibold text-gray-900 leading-tight">
                                  {event.type}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {event.description}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center">
                          <p className="text-sm text-gray-400">
                            해당 카테고리의 분석 결과가 없습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
                  AI 분석 데이터 기준 타임라인
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
