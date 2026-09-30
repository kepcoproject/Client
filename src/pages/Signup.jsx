import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { checkLoginId, sendEmailCode, signup, verifyEmailCode } from "../api/auth";
import { ApiError } from "../api/client";
import Button from "../components/common/Button";
import "./Login.css";

// 서버(compat_routes.py EMAIL_PATTERN)와 같은 기준
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;

const messageOf = (err, fallback) =>
  err instanceof ApiError && err.message ? err.message : fallback;

const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    loginId: "",
    password: "",
    passwordConfirm: "",
    name: "",
    email: "",
  });
  const [idStatus, setIdStatus] = useState(null); // null | "checking" | "available" | "taken"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 이메일 인증. 메일로 받은 6자리 번호를 맞히면 서버가 emailToken 을 주고,
  // 가입 요청은 그 값이 있어야 받는다.
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailToken, setEmailToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [emailHint, setEmailHint] = useState(null); // { tone, text }
  const [codeHint, setCodeHint] = useState(null);
  const [now, setNow] = useState(() => Date.now());

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

  // 남은 시간 표시용 시계. 번호를 보낸 뒤 인증이 끝나기 전까지만 돈다.
  useEffect(() => {
    if (!codeSent || emailToken) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [codeSent, emailToken]);

  const passwordMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;

  const resendLeft = Math.ceil((resendAt - now) / 1000);
  const expired = codeSent && now >= expiresAt;

  const resetEmailVerification = () => {
    setEmailToken(null);
    setCodeSent(false);
    setCode("");
    setResendAt(0);
    setEmailHint(null);
    setCodeHint(null);
  };

  const onEmailChange = (e) => {
    setForm((f) => ({ ...f, email: e.target.value }));
    // 번호를 받은 주소와 다른 주소로 가입할 수는 없다
    if (codeSent || emailToken) resetEmailVerification();
  };

  const sendCode = async () => {
    const email = form.email.trim();
    if (!EMAIL_PATTERN.test(email)) {
      setEmailHint({ tone: "bad", text: "이메일 형식이 올바르지 않습니다" });
      return;
    }
    setSending(true);
    setEmailHint(null);
    try {
      const res = await sendEmailCode(email);
      const t = Date.now();
      setCodeSent(true);
      setCode("");
      setCodeHint(null);
      setExpiresAt(t + res.expiresIn * 1000);
      setResendAt(t + res.resendAfter * 1000);
      setNow(t);
      // "이메일 인증을 먼저 해 주세요" 를 보고 누른 경우다. 계속 띄워 둘 이유가 없다.
      setError("");
      setEmailHint({
        tone: "neutral",
        text: "인증번호를 보냈습니다. 메일이 안 보이면 스팸함도 확인하세요",
      });
    } catch (err) {
      setEmailHint({ tone: "bad", text: messageOf(err, "인증번호를 보내지 못했습니다") });
    } finally {
      setSending(false);
    }
  };

  const checkCode = async () => {
    if (code.length !== 6) {
      setCodeHint({ tone: "bad", text: "인증번호 6자리를 입력하세요" });
      return;
    }
    setChecking(true);
    setCodeHint(null);
    try {
      const res = await verifyEmailCode(form.email.trim(), code);
      setEmailToken(res.emailToken);
      setEmailHint(null);
      setError("");
    } catch (err) {
      setCodeHint({ tone: "bad", text: messageOf(err, "인증번호를 확인하지 못했습니다") });
    } finally {
      setChecking(false);
    }
  };

  // 폼 안에서 Enter 를 누르면 가입 신청이 나가 버린다. 지금 칸의 버튼을 대신 누른다.
  const onEnter = (action) => (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    action();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordMismatch || idStatus === "taken") return;
    if (!emailToken) {
      setError("이메일 인증을 먼저 해 주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signup({ ...form, emailToken });
      navigate("/login", {
        state: {
          notice: "가입 신청이 완료되었습니다. 관리자 승인이 끝나면 로그인할 수 있습니다.",
        },
      });
    } catch (err) {
      // 인증한 지 오래됐으면(E4004) 인증부터 다시 받게 한다
      if (err instanceof ApiError && err.code === "E4004") resetEmailVerification();
      // 서버가 사유를 정확히 알려준다 (이미 가입된 이메일, 비밀번호 길이 등).
      // 전부 같은 문구로 덮으면 무엇을 고쳐야 하는지 알 수 없다.
      setError(messageOf(err, "회원가입에 실패했습니다. 입력값을 확인해주세요"));
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

        {/* 입력칸 옆에 버튼이 있어 label 로 감싸지 않는다. 버튼 글자가 입력칸 이름에 섞인다. */}
        <div className="field">
          <label htmlFor="signup-email">
            <span>이메일</span>
          </label>
          <div className="field-row">
            <input
              id="signup-email"
              type="email"
              value={form.email}
              onChange={onEmailChange}
              onKeyDown={emailToken ? undefined : onEnter(sendCode)}
              readOnly={!!emailToken}
              autoComplete="email"
            />
            {emailToken ? (
              <Button type="button" variant="ghost" onClick={resetEmailVerification}>
                변경
              </Button>
            ) : (
              <Button
                type="button"
                onClick={sendCode}
                loading={sending}
                disabled={!form.email.trim() || resendLeft > 0}
              >
                {!codeSent ? "인증번호 받기" : resendLeft > 0 ? `재전송 ${resendLeft}초` : "재전송"}
              </Button>
            )}
          </div>
          {emailToken ? (
            <small className="field-hint hint-good">✓ 이메일 인증이 완료되었습니다</small>
          ) : (
            emailHint && (
              <small className={`field-hint hint-${emailHint.tone}`}>{emailHint.text}</small>
            )
          )}
        </div>

        {codeSent && !emailToken && (
          <div className="field">
            <label htmlFor="signup-code">
              <span>인증번호</span>
            </label>
            <div className="field-row">
              <div className="field-timer">
                <input
                  id="signup-code"
                  value={code}
                  // 메일에서 복사하면 공백이 딸려 온다. 숫자만 남긴다.
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={onEnter(checkCode)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6자리 숫자"
                  autoFocus
                />
                <em>{mmss(expiresAt - now)}</em>
              </div>
              <Button
                type="button"
                onClick={checkCode}
                loading={checking}
                disabled={code.length !== 6 || expired}
              >
                확인
              </Button>
            </div>
            {expired ? (
              <small className="field-hint hint-bad">
                인증번호가 만료되었습니다. 재전송을 눌러 다시 받으세요
              </small>
            ) : (
              codeHint && (
                <small className={`field-hint hint-${codeHint.tone}`}>{codeHint.text}</small>
              )
            )}
          </div>
        )}

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
