// api/client.js
// 요구사항(가이드 0.3):
// 1. Base URL 자동 부착
// 2. Authorization 헤더 자동 주입
// 3. 공통 응답 포맷 {success, data, error} 벗겨서 data만 반환
// 4. 401 E4010 -> 토큰 갱신 후 원요청 1회 재시도, 실패 시 로그인으로

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

let accessToken = null;
let onAuthFailure = () => {};
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// AuthContext가 로그아웃 처리를 등록해 둔다 (로그인 화면으로 리다이렉트 등)
export function registerAuthFailureHandler(fn) {
  onAuthFailure = fn;
}

class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function refreshAccessToken() {
  // 동시에 여러 요청이 401을 받아도 refresh는 한 번만 실행
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new ApiError("E4010", "리프레시 토큰 없음", 401);

      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new ApiError(body?.error?.code, body?.error?.message, res.status);
      }
      setAccessToken(body.data.accessToken);
      if (body.data.refreshToken) {
        localStorage.setItem("refreshToken", body.data.refreshToken);
      }
      return body.data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request(path, { method = "GET", body, headers, skipAuth } = {}, _retried = false) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken && !skipAuth ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content 등 바디 없는 응답 처리
  const text = await res.text();
  const json = text ? JSON.parse(text) : { success: true, data: null };

  if (!res.ok || json.success === false) {
    const code = json?.error?.code;

    if (res.status === 401 && code === "E4010" && !skipAuth && !_retried) {
      try {
        await refreshAccessToken();
        return request(path, { method, body, headers, skipAuth }, true);
      } catch {
        onAuthFailure();
        throw new ApiError(code, "세션이 만료되었습니다", 401);
      }
    }

    throw new ApiError(code, json?.error?.message || "요청에 실패했습니다", res.status);
  }

  return json.data;
}

export const apiClient = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

export { ApiError };
