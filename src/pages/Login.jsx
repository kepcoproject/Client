import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import Button from "../components/common/Button";
import "./Login.css";

const ERROR_MESSAGES = {
  E4010: "아이디 또는 비밀번호가 올바르지 않습니다",
  E4030: "승인 대기 중인 계정입니다. 관리자에게 문의하세요",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // 회원가입·비밀번호 재설정이 여기로 넘겨주는 안내. 지금까지 아무 데서도
  // 읽지 않아서 "가입 신청이 완료되었습니다" 가 화면에 뜬 적이 없었다.
  const notice = location.state?.notice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await login(loginId, password);
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(ERROR_MESSAGES[err.code] || "로그인에 실패했습니다");
      } else {
        setError("로그인에 실패했습니다");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span>스마트 에너지 절약 시스템</span>
        </div>
        <h1>로그인</h1>

        <label className="field">
          <span>아이디</span>
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
            autoFocus
          />
        </label>

        <label className="field">
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {notice && !error && <div className="login-notice">{notice}</div>}
        {error && <div className="login-error">{error}</div>}

        <Button type="submit" loading={loading} style={{ width: "100%", marginTop: 4 }}>
          로그인
        </Button>

        <p className="login-footer">
          <Link to="/forgot-password">비밀번호를 잊으셨나요?</Link>
        </p>

        <p className="login-footer">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </form>
    </div>
  );
}
