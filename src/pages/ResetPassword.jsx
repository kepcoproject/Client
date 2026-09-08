import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Zap } from "lucide-react";
import { resetPassword } from "../api/auth";
import { ApiError } from "../api/client";
import Button from "../components/common/Button";
import "./Login.css";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mismatch = passwordConfirm.length > 0 && password !== passwordConfirm;
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || mismatch || tooShort) return;
    setError("");
    setLoading(true);
    try {
      await resetPassword({ token, newPassword: password, passwordConfirm });
      navigate("/login", {
        state: { notice: "비밀번호를 바꿨습니다. 새 비밀번호로 로그인하세요." },
      });
    } catch (err) {
      // 서버가 사유를 알려준다 (링크 만료, 길이 부족 등).
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : "비밀번호를 바꾸지 못했습니다"
      );
    } finally {
      setLoading(false);
    }
  };

  // 링크에 토큰이 없으면 주소를 잘못 열었거나 메일 앱이 잘라먹은 경우다.
  if (!token) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <div className="login-brand">
            <Zap size={16} strokeWidth={2.4} />
            <span>스마트 에너지 절약 시스템</span>
          </div>
          <h1>링크가 올바르지 않습니다</h1>
          <div className="login-error">
            메일에 있는 주소를 그대로 열어 주세요. 주소가 잘렸을 수 있습니다.
          </div>
          <p className="login-footer">
            <Link to="/forgot-password">재설정 링크 다시 받기</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <Zap size={16} strokeWidth={2.4} />
          <span>스마트 에너지 절약 시스템</span>
        </div>
        <h1>새 비밀번호</h1>

        <label className="field">
          <span>새 비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
          />
          {tooShort && (
            <small className="field-hint hint-bad">
              {MIN_PASSWORD_LENGTH}자 이상이어야 합니다
            </small>
          )}
        </label>

        <label className="field">
          <span>새 비밀번호 확인</span>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {mismatch && (
            <small className="field-hint hint-bad">비밀번호가 일치하지 않습니다</small>
          )}
        </label>

        {error && <div className="login-error">{error}</div>}

        <Button type="submit" loading={loading} style={{ width: "100%", marginTop: 4 }}>
          비밀번호 바꾸기
        </Button>

        <p className="login-footer">
          <Link to="/login">로그인으로 돌아가기</Link>
        </p>
      </form>
    </div>
  );
}
