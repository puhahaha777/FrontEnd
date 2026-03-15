// src/types/reportMock.ts
import type { ReportResponse } from "./reportpageType";

// ── Top player: 4 representative positions (x < 50 = upper half of court)
const topHeatmap = [
  { x: 20, y: 40, value: 0.85, timeSec: 25 },
  { x: 28, y: 62, value: 0.70, timeSec: 58 },
  { x: 14, y: 35, value: 0.60, timeSec: 12 },
  { x: 38, y: 52, value: 0.75, timeSec: 89 },
];

// ── Bottom player: 3 representative positions (x > 50 = lower half)
const bottomHeatmap = [
  { x: 65, y: 48, value: 0.90, timeSec: 42 },
  { x: 78, y: 28, value: 0.72, timeSec: 71 },
  { x: 58, y: 62, value: 0.65, timeSec: 19 },
];

export const mockReport: ReportResponse = {
  code: 200,
  message: "성공",
  data: {
    videoId: 1,
    // ── 경기 전체 요약 (두 플레이어 합산)
    summary: {
      matchOutcome: "WIN",
      myScore: 1,
      opponentScore: 0,
      totalStrokeCount: 7, // 양측 합산
      matchTime: "00:08",
    },
    players: {
      top: {
        positionAnalysis: { heatmapData: topHeatmap },
        strokeTypes: { smash: 1, clear: 1, drop: 1, drive: 0 },
        abilityMetrics: { smash: 62, defense: 78, speed: 65, stamina: 80, accuracy: 71 },
        aiCoaching: { feedbackText: "" },
      },
      bottom: {
        positionAnalysis: { heatmapData: bottomHeatmap },
        strokeTypes: { smash: 2, clear: 1, drop: 0, drive: 1 },
        abilityMetrics: { smash: 85, defense: 68, speed: 72, stamina: 75, accuracy: 80 },
        aiCoaching: { feedbackText: "" },
      },
    },
    // Legacy flat (bottom mirror)
    positionAnalysis: { heatmapData: bottomHeatmap },
    strokeTypes: { smash: 35, clear: 82, drop: 41, drive: 119 },
    abilityMetrics: { smash: 85, defense: 68, speed: 72, stamina: 75, accuracy: 80 },
    aiCoaching: { feedbackText: "" },
  },
};