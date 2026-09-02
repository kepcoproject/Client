import { apiClient } from "./client";

// A-01 로그인
export const login = (loginId, password) =>
  apiClient.post("/auth/login", { loginId, password }, { skipAuth: true });

// A-02 토큰 갱신은 client.js 내부에서 직접 처리 (401 인터셉터)

// A-04 내 정보 조회
export const getMe = () => apiClient.get("/auth/me");

// A-05 회원가입
export const signup = (payload) =>
  apiClient.post("/auth/signup", payload, { skipAuth: true });

// A-06 아이디 중복 확인
export const checkLoginId = (loginId) =>
  apiClient.get(`/auth/check-id?loginId=${encodeURIComponent(loginId)}`, {
    skipAuth: true,
  });
