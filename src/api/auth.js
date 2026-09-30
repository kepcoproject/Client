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

// A-12 회원가입 인증번호 보내기 - 6자리 숫자를 메일로 보낸다
// 응답: { sent, expiresIn(초), resendAfter(초) }
export const sendEmailCode = (email) =>
  apiClient.post("/auth/email/code", { email }, { skipAuth: true });

// A-13 인증번호 확인 - 맞으면 emailToken 을 준다. 회원가입 요청에 함께 싣는다.
export const verifyEmailCode = (email, code) =>
  apiClient.post("/auth/email/code/verify", { email, code }, { skipAuth: true });
