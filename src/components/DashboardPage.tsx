import { useState } from 'react';
import {
  Upload,
  Play,
  FileText,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import { Header, type Page } from './Header';

interface VideoRecord {
  id: string;
  name: string;
  date: string;
  duration: string;
  score?: string;
  thumbnail?: string;
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
  const [videoName, setVideoName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Mock data
  const [videos, setVideos] = useState<VideoRecord[]>([
    {
      id: '1',
      name: '주말 복식 경기',
      date: '2026-01-02',
      duration: '45:23',
      score: '21-18, 19-21, 21-16',
    },
    {
      id: '2',
      name: '연습 경기 - 스매시 집중',
      date: '2025-12-28',
      duration: '32:15',
      score: '21-15, 21-12',
    },
    {
      id: '3',
      name: '클럽 대회 준결승',
      date: '2025-12-20',
      duration: '58:40',
      score: '18-21, 21-19, 21-17',
    },
  ]);

  const handleDelete = (id: string) => {
    if (confirm('이 영상을 삭제하시겠습니까?')) {
      setVideos(videos.filter((v) => v.id !== id));
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    // Mock upload
    setTimeout(() => {
      const newVideo: VideoRecord = {
        id: Date.now().toString(),
        name: videoName || uploadFile?.name || '새 영상',
        date: new Date().toISOString().split('T')[0],
        duration: '00:00',
      };
      setVideos([newVideo, ...videos]);
      setShowUploadModal(false);
      setUploadFile(null);
      setVideoName('');
      setIsUploading(false);
    }, 2000);
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
            <p className="text-gray-600">업로드한 영상과 분석 리포트를 확인하세요</p>
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">총 업로드 영상</div>
            <div className="text-3xl text-blue-600">{videos.length}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">총 분석 시간</div>
            <div className="text-3xl text-indigo-600">2시간 16분</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">평균 점수</div>
            <div className="text-3xl text-purple-600">85점</div>
          </div>
        </div>

        {/* Video List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl">최근 영상</h2>
          </div>

          {videos.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Upload className="size-12 mx-auto mb-4 text-gray-400" />
              <p>업로드된 영상이 없습니다</p>
              <p className="text-sm mt-2">첫 영상을 업로드해보세요!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-6">
                    {/* Thumbnail */}
                    <div className="w-32 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Play className="size-8 text-blue-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-xl mb-2">{video.name}</h3>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>{video.date}</span>
                        <span>재생시간: {video.duration}</span>
                        {video.score && <span>점수: {video.score}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onViewVideo(video.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Play className="size-4" />
                        <span>영상 보기</span>
                      </button>
                      <button
                        onClick={() => onViewReport(video.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <FileText className="size-4" />
                        <span>분석 보기</span>
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
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
                    required
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
                  disabled={isUploading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isUploading}
                >
                  {isUploading ? '업로드 중...' : '업로드'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}