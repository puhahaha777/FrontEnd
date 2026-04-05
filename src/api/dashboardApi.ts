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

// 대시보드 데이터 가져오기
export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await apiClient('/api/v1/dashboard');
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

// 비디오 삭제 API (임시)
export async function deleteVideo(videoId: string): Promise<void> {
  const token = localStorage.getItem('accessToken');
  const response = await apiClient(`/api/v1/videos/${videoId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete video');
}