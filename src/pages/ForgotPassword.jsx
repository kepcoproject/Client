import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { forgotPassword } from "../api/auth";
import Button from "../components/common/Button";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch {
      // 서버는 없는 주소에도 성공으로 답한다. 여기서 실패가 나면 통신 문제이지
      // 주소 문제가 아니므로, 그래도 같은 안내를 보여 준다.
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <div className="login-brand">
            <Zap size={16} strokeWidth={2.4} />
            <span>스마트 에너지 절약 시스템</span>
          </div>
          <h1>메일을 확인하세요</h1>
          <div className="login-notice">
            가입할 때 쓴 이메일이라면 재설정 링크를 보냈습니다. 링크는 30분 동안만
            쓸 수 있습니다.
          </div>
          <p className="login-footer" style={{ marginTop: 0 }}>
            메일이 오지 않았다면 주소가 다르거나, 아직 이메일 인증을 하지 않은
            계정일 수 있습니다.
          </p>
          <p className="login-footer">
            <Link to="/login">로그인으로 돌아가기</Link>
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
        <h1>비밀번호 찾기</h1>

        <label className="field">
          <span>가입할 때 쓴 이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            autoFocus
          />
        </label>

        <Button type="submit" loading={loading} style={{ width: "100%", marginTop: 4 }}>
          재설정 링크 받기
        </Button>

        <p className="login-footer">
          비밀번호가 기억나셨나요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </div>
  );
}
