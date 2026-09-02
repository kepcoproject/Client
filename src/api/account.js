import { apiClient } from "./client";

// 비밀번호 변경 - 문서 명세에는 없지만 설정 화면에 필요해 추가한 엔드포인트
export const changePassword = (currentPassword, newPassword) =>
  apiClient.patch("/auth/password", { currentPassword, newPassword });
