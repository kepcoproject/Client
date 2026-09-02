import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setAccessToken, registerAuthFailureHandler } from "../api/client";
import { login as loginApi, getMe } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("checking"); // checking | authed | guest

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem("refreshToken");
    setUser(null);
    setStatus("guest");
  }, []);

  useEffect(() => {
    registerAuthFailureHandler(logout);
  }, [logout]);

  // 앱 최초 진입 시 세션 유효성 확인 (4단계: 인증 가드)
  useEffect(() => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      setStatus("guest");
      return;
    }
    // access token이 없어도 401 인터셉터가 refresh를 시도하므로 그대로 호출
    getMe()
      .then((me) => {
        setUser(me);
        setStatus("authed");
      })
      .catch(() => {
        setStatus("guest");
      });
  }, []);

  const login = useCallback(async (loginId, password) => {
    const data = await loginApi(loginId, password);
    setAccessToken(data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);
    setStatus("authed");
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다");
  return ctx;
}
