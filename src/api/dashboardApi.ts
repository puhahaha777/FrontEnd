// src/api/dashboardApi.ts

export interface DashboardSummary {
  totalVideos: number;
  totalAnalysisTime: string;
  averageScore: number;
}

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

export interface DashboardResponse {
  code: number;
  message: string;
  data: {
    dashboardSummary: DashboardSummary;
    recentVideos: ApiVideoItem[];
  };
}

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
