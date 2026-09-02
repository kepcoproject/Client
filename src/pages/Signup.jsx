import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { checkLoginId, signup } from "../api/auth";
import Button from "../components/common/Button";
import "./Login.css";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    loginId: "",
    password: "",
    passwordConfirm: "",
    name: "",
    email: "",
    inviteCode: "",
  });
  const [idStatus, setIdStatus] = useState(null); // null | "checking" | "available" | "taken"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // 아이디 입력 멈춘 뒤 400ms 디바운스로 중복 확인
  useEffect(() => {
    if (form.loginId.length < 4) {
      setIdStatus(null);
      return;
    }
    setIdStatus("checking");
    const t = setTimeout(() => {
      checkLoginId(form.loginId)
        .then((res) => setIdStatus(res.available ? "available" : "taken"))
        .catch(() => setIdStatus(null));
    }, 400);
    return () => clearTimeout(t);
  }, [form.loginId]);

  const passwordMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordMismatch || idStatus === "taken") return;
    setLoading(true);
    setError("");
    try {
      await signup(form);
      navigate("/login", {
        state: { notice: "가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다." },
      });
    } catch {
      setError("회원가입에 실패했습니다. 입력값을 확인해주세요");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit} style={{ maxWidth: 380 }}>
        <div className="login-brand">
          <span>스마트 에너지 절약 시스템</span>
        </div>
        <h1>회원가입</h1>

        <label className="field">
          <span>아이디</span>
          <input value={form.loginId} onChange={set("loginId")} autoComplete="username" />
          {idStatus === "checking" && <small className="field-hint hint-neutral">확인 중...</small>}
          {idStatus === "available" && (
            <small className="field-hint hint-good">사용 가능한 아이디입니다</small>
          )}
          {idStatus === "taken" && (
            <small className="field-hint hint-bad">이미 사용 중인 아이디입니다</small>
          )}
        </label>

        <label className="field">
          <span>비밀번호</span>
          <input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" />
        </label>

        <label className="field">
          <span>비밀번호 확인</span>
          <input
            type="password"
            value={form.passwordConfirm}
            onChange={set("passwordConfirm")}
            autoComplete="new-password"
          />
          {passwordMismatch && (
            <small className="field-hint hint-bad">비밀번호가 일치하지 않습니다</small>
          )}
        </label>

        <label className="field">
          <span>이름</span>
          <input value={form.name} onChange={set("name")} />
        </label>

        <label className="field">
          <span>이메일</span>
          <input type="email" value={form.email} onChange={set("email")} />
        </label>

        <label className="field">
          <span>초대 코드</span>
          <input value={form.inviteCode} onChange={set("inviteCode")} />
        </label>

        {error && <div className="login-error">{error}</div>}

        <Button type="submit" loading={loading} style={{ width: "100%", marginTop: 4 }}>
          가입 신청
        </Button>

        <p className="login-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </div>
  );
}
