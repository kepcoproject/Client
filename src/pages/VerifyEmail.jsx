import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Zap } from "lucide-react";
import { verifyEmail } from "../api/auth";
import { ApiError } from "../api/client";
import "./Login.css";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState(token ? "checking" : "no-token");
  const [message, setMessage] = useState("");
  // React 18 개발 모드는 effect 를 두 번 실행한다. 토큰은 한 번 쓰면 사라지므로
  // 두 번째 호출이 "이미 사용된 링크"로 실패해 성공을 덮어쓴다.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmail(token)
      .then(() => setState("done"))
      .catch((err) => {
        setMessage(
          err instanceof ApiError && err.message
            ? err.message
            : "인증에 실패했습니다"
        );
        setState("failed");
      });
  }, [token]);

  const body = {
    checking: {
      title: "확인하는 중...",
      content: null,
    },
    done: {
      title: "이메일 인증 완료",
      content: (
        <>
          <div className="login-notice">
            이메일이 확인되었습니다. 관리자 승인이 끝나면 로그인할 수 있습니다.
          </div>
          <p className="login-footer" style={{ marginTop: 0 }}>
            이제 비밀번호를 잊어버려도 이 주소로 되찾을 수 있습니다.
          </p>
        </>
      ),
    },
    failed: {
      title: "인증하지 못했습니다",
      content: (
        <>
          <div className="login-error">{message}</div>
          <p className="login-footer" style={{ marginTop: 0 }}>
            링크는 24시간 동안만 쓸 수 있고, 한 번 열면 사라집니다.
          </p>
        </>
      ),
    },
    "no-token": {
      title: "링크가 올바르지 않습니다",
      content: (
        <div className="login-error">
          메일에 있는 주소를 그대로 열어 주세요. 주소가 잘렸을 수 있습니다.
        </div>
      ),
    },
  }[state];

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <Zap size={16} strokeWidth={2.4} />
          <span>스마트 에너지 절약 시스템</span>
        </div>
        <h1>{body.title}</h1>
        {body.content}
        <p className="login-footer">
          <Link to="/login">로그인으로 이동</Link>
        </p>
      </div>
    </div>
  );
}
