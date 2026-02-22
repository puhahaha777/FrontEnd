import { Play, FileText, Trash2, Loader2, AlertCircle } from "lucide-react";

export interface VideoItemProps {
  video: {
    id: string;
    name: string;
    date: string;
    duration: string;
    status?: "uploading" | "processing" | "completed" | "error";
  };
  onViewVideo: (id: string) => void;
  onViewReport: (id: string) => void;
  onDelete: (id: string) => void;
}

export function VideoItem({
  video,
  onViewVideo,
  onViewReport,
  onDelete,
}: VideoItemProps) {
  // 상태별 파생 변수 정리
  const isUploading = video.status === "uploading";
  const isProcessing =
    video.status === "processing" || video.duration === "분석 중";
  const isError = video.status === "error";
  const isReady = !isUploading && !isProcessing && !isError;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors border-b last:border-b-0 border-gray-100">
      <div className="flex items-center gap-6">
        {/* 썸네일 영역 (상태 아이콘) */}
        <div
          className={`w-32 h-20 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isProcessing
              ? "bg-indigo-50"
              : isUploading
                ? "bg-blue-50"
                : isError
                  ? "bg-red-50"
                  : "bg-gray-100"
          }`}
        >
          {isUploading ? (
            <Loader2 className="size-8 text-blue-500 animate-spin" />
          ) : isProcessing ? (
            <div className="relative">
              <Loader2 className="size-8 text-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-2 bg-indigo-500 rounded-full animate-pulse" />
              </div>
            </div>
          ) : isError ? (
            <AlertCircle className="size-8 text-red-500" />
          ) : (
            <Play className="size-8 text-blue-600" />
          )}
        </div>

        {/* 정보 영역 */}
        <div className="flex-1">
          <h3 className="text-xl mb-2 flex items-center gap-2">
            {video.name}
            {isUploading && (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                업로드 중...
              </span>
            )}
            {isProcessing && (
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                분석 중...
              </span>
            )}
            {isError && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                실패
              </span>
            )}
          </h3>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>{video.date}</span>
            {isProcessing ? (
              <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                배드민턴 영상 분석 중
              </span>
            ) : (
              <span>{video.duration}</span>
            )}
          </div>
        </div>

        {/* 액션 버튼 영역 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => isReady && onViewVideo(video.id)}
            disabled={!isReady}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isReady
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            <span>{isUploading ? "처리 중" : "영상 보기"}</span>
          </button>

          <button
            onClick={() => isReady && onViewReport(video.id)}
            disabled={!isReady}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isReady
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            <span>{isUploading ? "처리 중" : "분석 보기"}</span>
          </button>

          <button
            onClick={() => onDelete(video.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="size-5" />
          </button>
        </div>

        {/* 진행률 바 (Processing 상태일 때만) */}
        {isProcessing && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-50 overflow-hidden">
            <div
              className="h-full bg-indigo-500 w-1/3 rounded-full animate-bounce"
              style={{ animationDuration: "3s" }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
