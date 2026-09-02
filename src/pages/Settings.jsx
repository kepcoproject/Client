import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { changePassword } from "../api/account";
import { ApiError } from "../api/client";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import "./Dashboard.css";
import "./Settings.css";

const ROLE_LABEL = { ADMIN: "관리자", MEMBER: "일반" };

export default function Settings() {
  const { user, logout } = useAuth();

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [prefs, setPrefs] = useState({
    wasteAlert: true,
    errorAlert: true,
    emailDigest: false,
  });

  const pwMutation = useMutation({
    mutationFn: () => changePassword(pwForm.current, pwForm.next),
    onSuccess: () => {
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSuccess(false), 3000);
    },
    onError: (err) => {
      setPwError(err instanceof ApiError ? err.message : "비밀번호 변경에 실패했습니다");
    },
  });

  const mismatch = pwForm.confirm.length > 0 && pwForm.next !== pwForm.confirm;

  const handlePwSubmit = (e) => {
    e.preventDefault();
    setPwError("");
    if (mismatch) return;
    pwMutation.mutate();
  };

  const togglePref = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div>
      <h1 className="page-title">설정</h1>

      <div className="settings-section">
        <div className="settings-section-title">계정 정보</div>
        <div className="account-card">
          <div className="account-avatar">{user?.name?.[0] ?? "?"}</div>
          <div className="account-info">
            <div className="account-name">
              {user?.name} <Badge tone="blue">{ROLE_LABEL[user?.role] ?? user?.role}</Badge>
            </div>
            <div className="account-meta">
              아이디 {user?.loginId} · {user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">비밀번호 변경</div>
        <form className="settings-card" onSubmit={handlePwSubmit}>
          <label className="field">
            <span>현재 비밀번호</span>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
              autoComplete="current-password"
              required
            />
          </label>
          <label className="field">
            <span>새 비밀번호</span>
            <input
              type="password"
              value={pwForm.next}
              onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className="field">
            <span>새 비밀번호 확인</span>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              autoComplete="new-password"
              required
            />
            {mismatch && <small className="field-hint hint-bad">비밀번호가 일치하지 않습니다</small>}
          </label>

          {pwError && <div className="login-error">{pwError}</div>}
          {pwSuccess && (
            <div className="settings-success">
              <CheckCircle2 size={14} strokeWidth={2.3} />
              비밀번호가 변경되었습니다
            </div>
          )}

          <Button type="submit" loading={pwMutation.isPending} disabled={mismatch}>
            비밀번호 변경
          </Button>
        </form>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">알림</div>
        <div className="settings-card">
          <div className="toggle-row">
            <div>
              <div className="toggle-label">공실 낭비 감지 알림</div>
              <div className="toggle-desc">공실인데 전력이 소비되고 있을 때 알림을 받습니다</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={prefs.wasteAlert}
                onChange={() => togglePref("wasteAlert")}
              />
              <span className="switch-track" />
            </label>
          </div>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">노드 오류 알림</div>
              <div className="toggle-desc">센서 노드가 오프라인이거나 오류 상태일 때 알림을 받습니다</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={prefs.errorAlert}
                onChange={() => togglePref("errorAlert")}
              />
              <span className="switch-track" />
            </label>
          </div>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">주간 요약 이메일</div>
              <div className="toggle-desc">매주 월요일 절감 리포트를 이메일로 받습니다</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={prefs.emailDigest}
                onChange={() => togglePref("emailDigest")}
              />
              <span className="switch-track" />
            </label>
          </div>
          <div className="settings-note">
            알림 환경설정은 아직 서버에 저장되지 않는 데모 화면이에요. 새로고침하면 초기화됩니다.
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">계정</div>
        <div className="settings-card">
          <Button variant="ghost" onClick={logout}>
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  );
}
