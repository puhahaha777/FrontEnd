import {ReportResponse} from "../types/reportpageType"
import { apiClient } from './apiClient';
// import { mockReport } from "../types/reportMock";

export async function fetchReport(
  videoId: string | number
): Promise<ReportResponse> {
  const res = await apiClient(`/api/v1/analysis/${videoId}`);
 
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as any).message ?? `리포트 조회 실패: ${res.status}`);
  }
 
  return res.json() as Promise<ReportResponse>;
}