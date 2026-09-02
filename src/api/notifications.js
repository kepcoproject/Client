import { apiClient } from "./client";

// H-02 알림 목록 (헤더 벨 아이콘, 30초 폴링)
export const getNotifications = () => apiClient.get("/notifications");
