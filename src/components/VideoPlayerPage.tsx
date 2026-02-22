import { useState, useRef, useEffect, useMemo } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);

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
      videoRef.current.play(); // 이동 후 바로 재생 (선택 사항)
      setIsPlaying(true);
    }
  };

  // 하단 컨트롤러의 재생/일시정지 버튼 작동 로직
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

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
                {/* 실제 비디오 플레이어 컴포넌트로 대체 필요 (예: <video> 태그 또는 서드파티 라이브러리) */}
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
                      ref={(el) => {
                        if (el) (videoRef as any).current = el;
                      }}
                      src={videoInfo?.videoUrl}
                      className="w-full h-full object-contain bg-black"
                      onTimeUpdate={(e) =>
                        setCurrentTime(e.currentTarget.currentTime)
                      }
                      // 2. 영상 메타데이터 로드 시 duration 업데이트 (API 값이 없을 때 대비)
                      onLoadedMetadata={(e) => {
                        if (!videoInfo?.duration) {
                          setDuration(e.currentTarget.duration);
                        }
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onClick={togglePlay} // 화면 클릭 시 재생/일시정지
                    />

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
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden cursor-pointer group">
                  <div
                    className="absolute left-0 top-0 h-full bg-blue-600 transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  {/* Highlight markers */}
                  {derivedHighlights.map((h) => (
                    <div
                      key={h.id}
                      className={`absolute top-0 w-1 h-full ${getHighlightColor(h.type)}`}
                      style={{ left: `${(h.time / duration) * 100}%` }}
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
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
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
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <SkipForward className="size-6" />
                  </button>
                </div>

                <div className="w-[120px] text-right">
                  <span className="text-sm font-semibold text-blue-600">
                    1.0x Speed
                  </span>
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
