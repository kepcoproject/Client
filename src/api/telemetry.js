import { apiClient } from "./client";

// D-02 공간별 전력 측정 이력
// interval: 기간 탭에 따라 서버가 다운샘플링해서 내려준다 (1시간→1m / 6·24시간→10m / 7일→1h)
export const getPowerHistory = (spaceId, { interval, hours }) =>
  apiClient.get(`/telemetry/power-history/${spaceId}?interval=${interval}&hours=${hours}`);
