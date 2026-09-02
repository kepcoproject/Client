import { apiClient } from "./client";

// F-01 추천 목록
export const getRecommendations = () => apiClient.get("/recommendations");

// F-02 적용
export const applyRecommendation = (recommendationId) =>
  apiClient.post(`/recommendations/${recommendationId}/apply`);

// F-02 반려 (comment는 학습 피드백으로 전달)
export const rejectRecommendation = (recommendationId, comment) =>
  apiClient.post(`/recommendations/${recommendationId}/reject`, { comment });
