import { apiClient } from "./client";

// B-02 목록 (건물/층 필터 지원)
export const getSpaces = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();
  return apiClient.get(`/spaces${qs ? `?${qs}` : ""}`);
};

// B-03 상세
export const getSpace = (spaceId) => apiClient.get(`/spaces/${spaceId}`);

// B-01 등록
export const createSpace = (payload) => apiClient.post("/spaces", payload);

// B-04 수정
export const updateSpace = (spaceId, payload) => apiClient.patch(`/spaces/${spaceId}`, payload);

// B-05 삭제
export const deleteSpace = (spaceId) => apiClient.delete(`/spaces/${spaceId}`);
