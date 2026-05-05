// src/api/dashboardApi.ts
import { apiClient } from './apiClient';

export interface DashboardSummary {
  totalVideos: number;
  totalAnalysisTime: string;
  averageScore: number;
}

// API에서 받아올 비디오 아이템 구조 정의
export interface ApiVideoItem {
  videoId: number;
  title: string;
  date: string;
  playTime: string;
  matchScore: string;
  thumbnailUrl: string;
  actions: {
    viewVideoUrl: string;
    viewAnalysisUrl: string;
  };
}

// API 응답 타입 정의
export interface DashboardResponse {
  code: number;
  message: string;
  data: {
    dashboardSummary: DashboardSummary;
    recentVideos: ApiVideoItem[];
  };
}

// ── 활동 통계 ─────────────────────────────────────────────────
// GET /api/v1/dashboard/activity
// 백엔드가 아직 미구현인 경우 null을 반환 → 스켈레톤 유지
export interface ActivityDataPoint {
  day: string;          // "월" | "화" | ...
  usageCount: number;   // 사이트 사용 횟수
  uploadCount: number;  // 업로드 영상 수
}

export interface ActivityResponse {
  code: number;
  message: string;
  data: ActivityDataPoint[];
}

// ── 퍼포먼스 트렌드 ────────────────────────────────────────────
// GET /api/v1/dashboard/trend
// 백엔드가 아직 미구현인 경우 null을 반환 → 스켈레톤 유지
export interface TrendResponse {
  code: number;
  message: string;
  data: {
    /** 최근 N주 스매시 점수 배열 (0~100) */
    smash: number[];
    /** 최근 N주 수비력 점수 배열 (0~100) */
    defense: number[];
    /** 최근 N주 정확도 점수 배열 (0~100) */
    accuracy: number[];
  };
}

// 대시보드 데이터 가져오기
export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await apiClient('/api/v1/dashboard');
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  return response.json();
}

// 활동 통계 (최근 7일)
export async function fetchActivityStats(): Promise<ActivityResponse | null> {
  try {
    const response = await apiClient('/api/v1/dashboard/activity');
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// 퍼포먼스 트렌드 (최근 7주)
export async function fetchPerformanceTrend(): Promise<TrendResponse | null> {
  try {
    const response = await apiClient('/api/v1/dashboard/trend');
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// 비디오 삭제
export async function deleteVideo(videoId: string): Promise<void> {
  const response = await apiClient(`/api/v1/videos/${videoId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete video');
}
