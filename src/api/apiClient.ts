/**
 * apiClient.ts
 *
 * 모든 인증이 필요한 API 요청의 공통 fetch 래퍼입니다.
 *
 * 동작 흐름:
 * 1. 요청 시 localStorage의 accessToken을 Authorization 헤더에 자동 첨부
 * 2. 응답이 401이면 refreshToken으로 토큰 갱신 시도
 * 3. 갱신 성공 → 새 accessToken으로 원래 요청 1회 재시도
 * 4. 갱신 실패(refreshToken 만료 등) → 로그아웃 처리 후 로그인 모달 열기
 *
 * 사용법:
 *   import { apiClient } from './apiClient';
 *   const data = await apiClient('/api/v1/dashboard');
 */

const BASE_URL = '';  // Vite proxy 사용 중이므로 빈 문자열

// ─── 토큰 갱신 중 동시 요청 처리를 위한 플래그 ────────────────────────────
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

/** 갱신 완료 후 대기 중인 요청들에 새 토큰 전달 */
function resolvePending(newToken: string) {
  pendingRequests.forEach((resolve) => resolve(newToken));
  pendingRequests = [];
}

/** 갱신 실패 시 대기 중인 요청들 취소 */
function rejectPending() {
  pendingRequests = [];
}

// ─── 외부에서 주입할 수 있는 로그아웃 콜백 ──────────────────────────────────
type LogoutCallback = () => void;
let onSessionExpired: LogoutCallback | null = null;

/**
 * App.tsx 등 최상위 컴포넌트에서 한 번 호출해 세션 만료 콜백을 등록합니다.
 *
 * @example
 *   // App.tsx
 *   useEffect(() => {
 *     registerSessionExpiredCallback(() => {
 *       handleLogout();      // localStorage 클리어
 *       openLoginModal();    // 로그인 모달 열기
 *     });
 *   }, []);
 */
export function registerSessionExpiredCallback(callback: LogoutCallback) {
  onSessionExpired = callback;
}

// ─── accessToken 갱신 ────────────────────────────────────────────────────────
async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('refreshToken 없음');

  const res = await fetch(`${BASE_URL}/api/v1/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error('refreshToken 만료 또는 무효');

  const json = await res.json();
  const { accessToken, refreshToken: newRefreshToken } = json.data;

  localStorage.setItem('accessToken', accessToken);
  if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

  return accessToken;
}

// ─── 세션 만료 처리 ──────────────────────────────────────────────────────────
function handleExpired() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  if (onSessionExpired) {
    onSessionExpired();
  } else {
    // 콜백이 등록되지 않은 경우 온보딩 페이지로 이동
    window.location.href = '/';
  }
}

// ─── 메인 fetch 래퍼 ─────────────────────────────────────────────────────────
/**
 * 인증이 필요한 API 요청을 보냅니다.
 * fetch 기본 옵션을 그대로 사용할 수 있으며, Authorization 헤더는 자동 첨부됩니다.
 *
 * @param url     요청 경로 (e.g. '/api/v1/dashboard')
 * @param options fetch RequestInit 옵션 (method, body, headers 등)
 * @returns       Response 객체
 * @throws        세션 만료 시 onSessionExpired 콜백 호출 후 Error throw
 */
export async function apiClient(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fullUrl = `${BASE_URL}${url}`;

  // 헤더 구성: 기존 헤더 + Authorization
  const buildHeaders = (token: string): HeadersInit => ({
    'Content-Type': 'application/json',
    ...options.headers,
    Authorization: `Bearer ${token}`,
  });

  const accessToken = localStorage.getItem('accessToken') ?? '';

  // 1차 요청
  let response = await fetch(fullUrl, {
    ...options,
    headers: buildHeaders(accessToken),
  });

  // 401이 아니면 그대로 반환
  if (response.status !== 401) return response;

  // ── 401: 토큰 갱신 필요 ────────────────────────────────────────────────
  if (isRefreshing) {
    // 이미 갱신 중이면 갱신 완료를 기다렸다가 재시도
    const newToken = await new Promise<string>((resolve, reject) => {
      pendingRequests.push(resolve);
      // 5초 안에 갱신 안 되면 timeout
      setTimeout(() => reject(new Error('refresh timeout')), 5000);
    });

    return fetch(fullUrl, {
      ...options,
      headers: buildHeaders(newToken),
    });
  }

  isRefreshing = true;

  try {
    const newToken = await refreshAccessToken();
    resolvePending(newToken);

    // 새 토큰으로 원래 요청 재시도
    response = await fetch(fullUrl, {
      ...options,
      headers: buildHeaders(newToken),
    });

    return response;
  } catch {
    rejectPending();
    handleExpired();
    throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
  } finally {
    isRefreshing = false;
  }
}

/**
 * apiClient 응답에서 JSON을 파싱하고 ok 여부를 검사하는 헬퍼.
 *
 * @example
 *   const data = await fetchJson<DashboardResponse>('/api/v1/dashboard');
 */
export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await apiClient(url, options);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
  return json as T;
}