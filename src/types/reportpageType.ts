// src/types/reportpageType.ts

// ─────────────────────────────────────────────────────────────────────────────
// 프론트엔드 공통 타입
// ─────────────────────────────────────────────────────────────────────────────

export type PlayerKey = "top" | "bottom";

export type HeatmapPoint = {
  x: number;       // 0~100 (코트 가로 %)
  y: number;       // 0~100 (코트 세로 %)
  value?: number;  // 0~1 intensity
  timeSec?: number;
};

/** 히트맵 인포패널용 - 코트 구역별 점유율 */
export type CourtZoneDistribution = {
  net: number;   // 0~100 (%)  네트 앞
  mid: number;   // 0~100 (%)  미드 코트
  back: number;  // 0~100 (%)  백 바운더리
};

export type PlayerData = {
  positionAnalysis: {
    heatmapData: HeatmapPoint[];
    /** 코트 구역별 점유율 — API에서 내려올 때 채워짐, 없으면 heatmapData에서 계산 */
    zoneDistribution?: CourtZoneDistribution;
  };
  strokeTypes: {
    smash: number;
    clear: number;
    drop: number;
    drive: number;
  };
  abilityMetrics: {
    smash: number;
    AvgRallyTime: number;
    speed: number;
    distance: number;
    errorRate: number;
  };
  aiCoaching: {
    feedbackText: string;
  };
};

export type ReportResponse = {
  code: number;
  message: string;
  data: {
    videoId: number;
    summary: {
      myScore: number;
      opponentScore: number;
      matchOutcome: "WIN" | "LOSE" | "DRAW";
      totalStrokeCount: number;
      matchTime: string;
    };
    players: {
      top: PlayerData;
      bottom: PlayerData;
    };
    // Legacy flat fields (하위 호환용)
    positionAnalysis: {
      heatmapData: HeatmapPoint[];
    };
    strokeTypes: {
      smash: number;
      clear: number;
      drop: number;
      drive: number;
    };
    abilityMetrics: {
      smash: number;
      AvgRallyTime: number;
      speed: number;
      distance: number;
      errorRate: number;
    };
    aiCoaching: {
      feedbackText: string;
    };
  };
};

export type ApiErrorResponse = {
  status: "error";
  error_code: number;
  message: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// 백엔드 RAW 응답 타입 (GET /api/v1/analysis/:videoId)
//
// ⚠️  백엔드 실제 응답 형태에 맞게 필드명/타입을 수정하세요.
//     현재 확인된 최상위 필드:
//       videoId, matchOutcome, bottomPlayerScore, topPlayerScore, totalHits
//     players / heatmap / stroke / ability 구조는 백엔드 팀과 확인 후 아래를 채워주세요.
// ─────────────────────────────────────────────────────────────────────────────

/** 백엔드가 내려주는 히트맵 포인트 한 개 */
export type RawHeatmapPoint = {
  x: number;
  y: number;
  /** 강도 (0~1). 필드명이 다를 경우 아래를 수정: intensity / value / weight */
  intensity?: number;
  value?: number;
  /** 영상 타임스탬프(초). 필드명이 다를 경우 수정: timeSec / timestamp / time */
  timeSec?: number;
  timestamp?: number;
};

/** 백엔드 플레이어별 데이터 블록 */
export type RawPlayerData = {
  // ── 히트맵 ──────────────────────────────────────────────────────────────
  /**
   * 히트맵 포인트 배열.
   * 필드명 후보: heatmapPoints / heatmapData / positionData / positions
   */
  heatmapPoints?: RawHeatmapPoint[];
  heatmapData?: RawHeatmapPoint[];

  /**
   * 코트 구역별 점유율 (네트/미드/백).
   * 백엔드가 직접 내려줄 경우 아래 중 하나를 채워주세요.
   * 없을 경우 heatmapPoints의 y좌표로 자동 계산됩니다.
   */
  zoneDistribution?: {
    /** 필드명 후보: net / netZone / frontZone */
    net?: number;
    /** 필드명 후보: mid / midZone / middleZone */
    mid?: number;
    /** 필드명 후보: back / backZone / rearZone */
    back?: number;
  };

  // ── 스트로크 ─────────────────────────────────────────────────────────────
  /**
   * 스트로크 종류별 횟수.
   * 필드명 후보: strokeTypes / strokes / strokeCounts
   */
  strokeTypes?: {
    /** 스매시 횟수 — 필드명 후보: smash / smashCount */
    smash?: number;
    /** 클리어 횟수 — 필드명 후보: clear / clearCount */
    clear?: number;
    /** 드롭 횟수  — 필드명 후보: drop / dropCount */
    drop?: number;
    /** 드라이브 횟수 — 필드명 후보: drive / driveCount */
    drive?: number;
  };

  // ── 능력치 ───────────────────────────────────────────────────────────────
  /**
   * 능력치 지표.
   * 필드명 후보: abilityMetrics / ability / metrics
   */
  abilityMetrics?: {
    /** 스매시 점수 (0~100) — 필드명 후보: smash / smashScore / smashPower */
    smash?: number;
    /** 평균 랠리 시간 (0~100 normalized) — 필드명 후보: AvgRallyTime / avgRallyTime / rallyTime */
    AvgRallyTime?: number;
    avgRallyTime?: number;
    /** 속도 점수 (0~100) — 필드명 후보: speed / speedScore */
    speed?: number;
    /** 이동 거리 점수 (0~100) — 필드명 후보: distance / moveDistance */
    distance?: number;
    /** 실책률 점수 (0~100) — 필드명 후보: errorRate / faultRate */
    errorRate?: number;
  };

  // ── AI 코칭 ──────────────────────────────────────────────────────────────
  /**
   * AI 코치 피드백.
   * 필드명 후보: aiCoaching / coaching / feedback
   */
  aiCoaching?: {
    /** 필드명 후보: feedbackText / feedback / text / comment */
    feedbackText?: string;
    feedback?: string;
    text?: string;
  };
};

/** 백엔드 GET /api/v1/analysis/:videoId 응답의 data 블록 */
export type RawAnalysisData = {
  videoId: number;

  // ── 경기 결과 ────────────────────────────────────────────────────────────
  /** "WIN" | "LOSE" | "DRAW" (Bottom Player 기준) */
  matchOutcome?: string;
  /** Bottom Player 득점 */
  bottomPlayerScore?: number;
  /** Top Player 득점 */
  topPlayerScore?: number;
  /** 양측 합산 총 스트로크 수 */
  totalHits?: number;
  /**
   * 경기 총 시간 문자열.
   * 필드명 후보: matchTime / duration / totalTime / playTime
   */
  matchTime?: string;
  duration?: string;
  totalTime?: string;

  // ── 플레이어 데이터 ───────────────────────────────────────────────────────
  /**
   * 플레이어별 분석 데이터.
   * 구조 후보 A: players: { top: RawPlayerData, bottom: RawPlayerData }
   * 구조 후보 B: topPlayer: RawPlayerData, bottomPlayer: RawPlayerData
   * 구조 후보 C: playerData: [RawPlayerData, RawPlayerData]  (index 0=top, 1=bottom)
   */
  players?: {
    top?: RawPlayerData;
    bottom?: RawPlayerData;
  };
  topPlayer?: RawPlayerData;
  bottomPlayer?: RawPlayerData;
};

/** 백엔드 GET /api/v1/analysis/:videoId 전체 응답 */
export type RawAnalysisResponse = {
  code: number;
  message: string;
  data: RawAnalysisData;
};
