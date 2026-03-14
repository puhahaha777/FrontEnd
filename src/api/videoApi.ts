export interface VideoInfo {
  videoId: number;
  title: string;
  videoUrl: string;
  skeletonVideoUrl?: string;
  thumbnailUrl: string;
  duration: number;
}

export interface MatchSummary {
  matchScore: string;
}

export interface ApiTimelineEvent {
  eventId: number;
  timestamp: number;
  displayTime: string;
  type: string; // Korean type e.g. '득점', '랠리', '스매시'
  title: string;
  description: string;
}

export interface VideoDetailData {
  videoInfo: VideoInfo;
  matchSummary: MatchSummary;
  timelineEvents: ApiTimelineEvent[];
}

export interface VideoDetailResponse {
  code: number;
  message: string;
  data: VideoDetailData;
}

export async function fetchVideoDetail(videoId: string | number): Promise<VideoDetailData> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`/api/v1/videos/${videoId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch video detail: ${res.status} ${text}`);
  }

  const json = (await res.json()) as VideoDetailResponse;
  return json.data;
}
