import { apiClient } from './apiClient';

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

export async function fetchVideoDetail(
  videoId: string | number
): Promise<VideoDetailData> {
  // 이 엔드포인트는 백엔드에서 인증 없이도 동작하지만,
  // apiClient를 통해 일관성 있게 처리합니다.
  const res = await apiClient(`/api/v1/videos/${videoId}`);
 
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch video detail: ${res.status} ${text}`);
  }
 
  const json = (await res.json()) as VideoDetailResponse;
  return json.data;
}
