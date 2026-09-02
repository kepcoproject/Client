import { apiClient } from "./client";

// A-08 사용자 목록
export const getUsers = () => apiClient.get("/users");

// A-09 승인 · 권한 변경
export const updateUserStatus = (userId, payload) => apiClient.patch(`/users/${userId}`, payload);
