import { apiClient } from "./client";

// H-01 기간별 절감 리포트
export const getSavingReport = ({ period, spaceId }) => {
  const qs = new URLSearchParams({ period, ...(spaceId ? { spaceId } : {}) });
  return apiClient.get(`/reports/savings?${qs}`);
};
