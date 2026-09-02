import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, WifiOff } from "lucide-react";
import { postControl, getCommandStatus } from "../api/control";
import { ApiError } from "../api/client";
import "./ControlPanel.css";

const ACTUATOR_META = {
  LIGHT: {
    label: "조명",
    options: [
      { value: "ON", label: "켜기" },
      { value: "OFF", label: "끄기" },
    ],
  },
  VENT: {
    label: "환기구",
    options: [
      { value: "OPEN", label: "열기" },
      { value: "CLOSE", label: "닫기" },
    ],
  },
};

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 15000;

export default function ControlPanel({ spaceId, actuators }) {
  const [overrideMinutes, setOverrideMinutes] = useState("30");
  const [statusByAction, setStatusByAction] = useState({});
  const timers = useRef({});

  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  const setPhase = (action, phase, extra) =>
    setStatusByAction((s) => ({ ...s, [action]: { phase, ...extra } }));

  const pollStatus = (action, commandId, startedAt) => {
    timers.current[action] = setTimeout(async () => {
      try {
        const cmd = await getCommandStatus(commandId);
        if (cmd.status === "COMPLETED") {
          setPhase(action, "completed");
          timers.current[action] = setTimeout(() => setPhase(action, "idle"), 3000);
          return;
        }
      } catch {
        // 폴링 도중 일시적 오류는 무시하고 타임아웃까지 재시도
      }
      if (Date.now() - startedAt > TIMEOUT_MS) {
        setPhase(action, "no-response");
        return;
      }
      pollStatus(action, commandId, startedAt);
    }, POLL_INTERVAL_MS);
  };

  const send = async (action, value) => {
    setPhase(action, "pending");
    try {
      const res = await postControl(spaceId, {
        action,
        value,
        overrideMinutes: overrideMinutes === "infinite" ? null : Number(overrideMinutes),
      });
      // 202 PENDING을 받은 시점: 아직 아무것도 실행되지 않았다. 여기서 폴링을 시작한다.
      pollStatus(action, res.commandId, Date.now());
    } catch (err) {
      if (err instanceof ApiError && err.code === "E5030") {
        setPhase(action, "offline");
      } else {
        setPhase(action, "error");
      }
    }
  };

  const renderStatus = (status) => {
    if (!status || status.phase === "idle") return null;
    switch (status.phase) {
      case "pending":
        return (
          <span className="control-status pending">
            <Loader2 size={13} strokeWidth={2.3} className="spin-icon" />
            명령 전송 중…
          </span>
        );
      case "completed":
        return (
          <span className="control-status completed">
            <CheckCircle2 size={13} strokeWidth={2.3} />
            완료
          </span>
        );
      case "no-response":
        return (
          <span className="control-status error">
            <AlertTriangle size={13} strokeWidth={2.3} />
            응답 없음
          </span>
        );
      case "offline":
        return (
          <span className="control-status error">
            <WifiOff size={13} strokeWidth={2.3} />
            센서 노드가 오프라인입니다
          </span>
        );
      default:
        return (
          <span className="control-status error">
            <AlertTriangle size={13} strokeWidth={2.3} />
            제어에 실패했습니다
          </span>
        );
    }
  };

  const knownActuators = actuators.filter((a) => ACTUATOR_META[a]);

  if (knownActuators.length === 0) {
    return (
      <div className="control-card">
        <div className="control-card-title">제어</div>
        <div className="detail-meta">이 공간에는 제어 가능한 액추에이터가 없습니다</div>
      </div>
    );
  }

  return (
    <div className="control-card">
      <div className="control-card-head">
        <div className="control-card-title">제어</div>
        <label className="override-select">
          <span>오버라이드</span>
          <select value={overrideMinutes} onChange={(e) => setOverrideMinutes(e.target.value)}>
            <option value="30">30분</option>
            <option value="60">1시간</option>
            <option value="infinite">무기한</option>
          </select>
        </label>
      </div>

      {knownActuators.map((act) => {
        const meta = ACTUATOR_META[act];
        const status = statusByAction[act];
        const pending = status?.phase === "pending";
        return (
          <div className="control-row" key={act}>
            <div className="control-row-label">{meta.label}</div>
            <div className="control-row-actions">
              {meta.options.map((opt) => (
                <button
                  key={opt.value}
                  className="control-btn"
                  disabled={pending}
                  onClick={() => send(act, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {renderStatus(status)}
          </div>
        );
      })}
    </div>
  );
}
