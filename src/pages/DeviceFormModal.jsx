import { useState } from "react";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";

const SENSOR_OPTIONS = [
  { value: "PIR", label: "PIR (재실 감지)" },
  { value: "LUX", label: "LUX (조도)" },
  { value: "CURRENT", label: "CURRENT (전류)" },
];

const ACTUATOR_OPTIONS = [
  { value: "LIGHT", label: "조명" },
  { value: "VENT", label: "환기구" },
];

export default function DeviceFormModal({ open, onClose, onSubmit, spaces, submitting, error }) {
  const [deviceId, setDeviceId] = useState("");
  const [spaceId, setSpaceId] = useState("");
  const [sensors, setSensors] = useState([]);
  const [actuators, setActuators] = useState([]);

  const reset = () => {
    setDeviceId("");
    setSpaceId("");
    setSensors([]);
    setActuators([]);
  };

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ deviceId, spaceId, sensors, actuators }, reset);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="노드 추가">
      <form onSubmit={handleSubmit}>
        <label className="field">
          <span>노드 ID (deviceId)</span>
          <input
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            required
            placeholder="예: NODE-A301-02"
          />
        </label>

        <label className="field">
          <span>소속 공간</span>
          <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} required>
            <option value="" disabled>
              공간 선택
            </option>
            {spaces.map((s) => (
              <option key={s.spaceId} value={s.spaceId}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>센서</span>
        </label>
        <div className="checkbox-row">
          {SENSOR_OPTIONS.map((opt) => (
            <label key={opt.value} className="checkbox-item">
              <input
                type="checkbox"
                checked={sensors.includes(opt.value)}
                onChange={() => toggle(sensors, setSensors, opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        <label className="field" style={{ marginTop: 14 }}>
          <span>액추에이터</span>
        </label>
        <div className="checkbox-row">
          {ACTUATOR_OPTIONS.map((opt) => (
            <label key={opt.value} className="checkbox-item">
              <input
                type="checkbox"
                checked={actuators.includes(opt.value)}
                onChange={() => toggle(actuators, setActuators, opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        {error && (
          <div className="login-error" style={{ marginTop: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <Button type="button" variant="ghost" onClick={handleClose} style={{ flex: 1 }}>
            취소
          </Button>
          <Button type="submit" loading={submitting} style={{ flex: 1 }}>
            추가
          </Button>
        </div>
      </form>
    </Modal>
  );
}
