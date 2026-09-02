import { apiClient } from "./client";

// E-01 재실 맵
export const getOccupancyMap = () => apiClient.get("/monitoring/occupancy-map");

// E-02 공간별 재실 이력
export const getOccupancyHistory = (spaceId, params) =>
  apiClient.get(`/monitoring/occupancy-history/${spaceId}?${new URLSearchParams(params)}`);

// E-03 실시간 전력
export const getRealtimePower = () => apiClient.get("/monitoring/realtime-power");

// E-04 절감량
export const getSavings = () => apiClient.get("/monitoring/savings");
