// src/api/reportpageApi.ts
import { apiClient } from "./apiClient";
import type {
  ReportResponse,
  PlayerData,
  RawAnalysisResponse,
  RawAnalysisData,
  RawPlayerData,
  RawHeatmapPoint,
  CourtZoneDistribution,
} from "../types/reportpageType";

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼: RawHeatmapPoint → HeatmapPoint 정규화
// ─────────────────────────────────────────────────────────────────────────────
function normalizeHeatmapPoint(p: RawHeatmapPoint) {
  return {
    x: p.x,
    y: p.y,
    // intensity / value 중 있는 것 사용, 없으면 0.5 기본값
    value: p.intensity ?? p.value ?? 0.5,
    // timeSec / timestamp 중 있는 것 사용
    timeSec: p.timeSec ?? p.timestamp,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼: heatmapPoints 배열로 코트 구역별 점유율 계산
//   y 좌표 기준 (0~100):
//     0~33  → 네트 앞 (net)
//    34~66  → 미드 코트 (mid)
//    67~100 → 백 바운더리 (back)
// ─────────────────────────────────────────────────────────────────────────────
function calcZoneDistribution(
  points: RawHeatmapPoint[]
): CourtZoneDistribution {
  if (!points || points.length === 0) {
    return { net: 0, mid: 0, back: 0 };
  }
  let net = 0, mid = 0, back = 0;
  points.forEach((p) => {
    if (p.y <= 33) net++;
    else if (p.y <= 66) mid++;
    else back++;
  });
  const total = points.length;
  return {
    net: Math.round((net / total) * 100),
    mid: Math.round((mid / total) * 100),
    back: Math.round((back / total) * 100),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼: RawPlayerData → PlayerData 변환
// ─────────────────────────────────────────────────────────────────────────────
function buildPlayerData(raw: RawPlayerData | null | undefined): PlayerData {
  if (!raw) return buildEmptyPlayerData();

  // ── 히트맵 ──
  const rawPoints = raw.heatmapPoints ?? raw.heatmapData ?? [];
  const heatmapData = rawPoints.map(normalizeHeatmapPoint);

  // ── 코트 구역 분포 ──
  // 백엔드가 직접 내려줄 경우 그것을 쓰고, 없으면 좌표로 계산
  let zoneDistribution: CourtZoneDistribution;
  if (raw.zoneDistribution) {
    zoneDistribution = {
      net:  raw.zoneDistribution.net  ?? 0,
      mid:  raw.zoneDistribution.mid  ?? 0,
      back: raw.zoneDistribution.back ?? 0,
    };
  } else {
    zoneDistribution = calcZoneDistribution(rawPoints);
  }

  // ── 스트로크 ──
  const st = raw.strokeTypes ?? {};
  const strokeTypes = {
    smash: st.smash ?? 0,
    clear: st.clear ?? 0,
    drop:  st.drop  ?? 0,
    drive: st.drive ?? 0,
  };

  // ── 능력치 ──
  const am = raw.abilityMetrics ?? {};
  const abilityMetrics = {
    smash:        am.smash        ?? 0,
    // AvgRallyTime: 대소문자 혼용 방어
    AvgRallyTime: am.AvgRallyTime ?? am.avgRallyTime ?? 0,
    speed:        am.speed        ?? 0,
    distance:     am.distance     ?? 0,
    errorRate:    am.errorRate    ?? 0,
  };

  // ── AI 코칭 ──
  const ac = raw.aiCoaching ?? {};
  const feedbackText =
    ac.feedbackText ?? ac.feedback ?? ac.text ?? "";

  return {
    positionAnalysis: { heatmapData, zoneDistribution },
    strokeTypes,
    abilityMetrics,
    aiCoaching: { feedbackText },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼: 빈 PlayerData 생성
// ─────────────────────────────────────────────────────────────────────────────
function buildEmptyPlayerData(): PlayerData {
  return {
    positionAnalysis: {
      heatmapData: [],
      zoneDistribution: { net: 0, mid: 0, back: 0 },
    },
    strokeTypes:    { smash: 0, clear: 0, drop: 0, drive: 0 },
    abilityMetrics: { smash: 0, AvgRallyTime: 0, speed: 0, distance: 0, errorRate: 0 },
    aiCoaching:     { feedbackText: "" },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼: RawAnalysisData에서 플레이어 raw 객체를 꺼내는 함수
//   백엔드 응답 구조가 아래 세 가지 중 하나일 수 있음:
//     A) data.players.top / data.players.bottom
//     B) data.topPlayer  / data.bottomPlayer
//     C) 아직 플레이어 분리 없음 (전체 단일 데이터)
// ─────────────────────────────────────────────────────────────────────────────
function extractPlayerRaw(
  data: RawAnalysisData,
  side: "top" | "bottom"
): RawPlayerData | null {
  // 구조 A
  if (data.players) {
    return data.players[side] ?? null;
  }
  // 구조 B
  if (side === "top"    && data.topPlayer)    return data.topPlayer;
  if (side === "bottom" && data.bottomPlayer) return data.bottomPlayer;

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 fetch 함수
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchReport(
  videoId: string | number
): Promise<ReportResponse> {
  const res = await apiClient(`/api/v1/analysis/${videoId}`);

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(
      (json as any).message ?? `리포트 조회 실패: ${res.status}`
    );
  }

  const raw: RawAnalysisResponse = await res.json();
  const d = raw.data;

  // ── 경기 요약 ──
  const matchTime =
    d.matchTime ?? d.duration ?? d.totalTime ?? "분석 완료";

  // ── 플레이어 데이터 변환 ──
  const topRaw    = extractPlayerRaw(d, "top");
  const bottomRaw = extractPlayerRaw(d, "bottom");
  const topData    = buildPlayerData(topRaw);
  const bottomData = buildPlayerData(bottomRaw);

  // ── legacy flat fields: bottom 데이터로 미러링 ──
  return {
    code:    raw.code,
    message: raw.message,
    data: {
      videoId: d.videoId,
      summary: {
        matchOutcome:     (d.matchOutcome as "WIN" | "LOSE" | "DRAW") ?? "DRAW",
        myScore:          d.bottomPlayerScore ?? 0,
        opponentScore:    d.topPlayerScore    ?? 0,
        totalStrokeCount: d.totalHits         ?? 0,
        matchTime,
      },
      players: {
        top:    topData,
        bottom: bottomData,
      },
      // legacy
      positionAnalysis: bottomData.positionAnalysis,
      strokeTypes:      bottomData.strokeTypes,
      abilityMetrics:   bottomData.abilityMetrics,
      aiCoaching:       bottomData.aiCoaching,
    },
  };
}
