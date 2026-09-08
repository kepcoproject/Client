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

// A-10 비밀번호 재설정 요청 - 가입한 이메일로 링크를 보낸다.
// 없는 주소든 인증 안 된 주소든 응답은 같다 (어떤 주소가 가입돼 있는지 감추기 위해).
export const forgotPassword = (email) =>
  apiClient.post("/auth/password/forgot", { email }, { skipAuth: true });

// A-11 재설정 링크의 토큰으로 새 비밀번호를 정한다
export const resetPassword = (payload) =>
  apiClient.post("/auth/password/reset", payload, { skipAuth: true });

// A-12 이메일 인증 - 메일 링크의 토큰을 확인한다
export const verifyEmail = (token) =>
  apiClient.post("/auth/email/verify", { token }, { skipAuth: true });

// A-13 인증 메일 다시 보내기
export const resendVerification = (email) =>
  apiClient.post("/auth/email/resend", { email }, { skipAuth: true });
