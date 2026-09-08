import { apiClient, setAccessToken } from "./client";

// 비밀번호 변경 - 문서 명세에는 없지만 설정 화면에 필요해 추가한 엔드포인트
export const changePassword = async (currentPassword, newPassword) => {
  const data = await apiClient.patch("/auth/password", { currentPassword, newPassword });

  // 비밀번호가 바뀌면 서버가 예전 토큰을 전부 무효로 만든다 (다른 기기의 세션도 끊긴다).
  // 방금 스스로 바꾼 본인까지 로그아웃될 이유는 없으므로, 함께 받은 새 토큰으로 갈아끼운다.
  // 이걸 하지 않으면 다음 요청부터 401이 나면서 영문 모를 로그아웃이 된다.
  if (data?.accessToken) {
    setAccessToken(data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
  }
  return data;
};
