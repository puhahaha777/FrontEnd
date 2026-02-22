// src/api/dashboardApi.ts

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
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('로그인이 필요합니다.');

  const response = await fetch('http://localhost:8080/api/v1/dashboard', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch');
  return await response.json();
}

// 비디오 삭제 API (임시)
export async function deleteVideo(videoId: string): Promise<void> {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`http://localhost:8080/api/v1/videos/${videoId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to delete video');
}