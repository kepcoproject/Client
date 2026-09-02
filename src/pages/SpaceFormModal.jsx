import { useEffect, useState } from "react";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";

const EMPTY = { code: "", name: "", building: "", floor: "", ratedPowerW: "" };

export default function SpaceFormModal({ open, onClose, onSubmit, initial, submitting, error }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
  }, [open, initial]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      floor: Number(form.floor),
      ratedPowerW: Number(form.ratedPowerW),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "공간 수정" : "공간 추가"}>
      <form onSubmit={handleSubmit}>
        <label className="field">
          <span>공간 코드</span>
          <input value={form.code} onChange={set("code")} required placeholder="예: A301" />
        </label>

        <label className="field">
          <span>이름</span>
          <input value={form.name} onChange={set("name")} required placeholder="예: 3층 회의실" />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <label className="field" style={{ flex: 1 }}>
            <span>건물</span>
            <input value={form.building} onChange={set("building")} required placeholder="예: A동" />
          </label>
          <label className="field" style={{ flex: 1 }}>
            <span>층</span>
            <input type="number" value={form.floor} onChange={set("floor")} required />
          </label>
        </div>

        <label className="field">
          <span>
            정격 소비전력 (W)
            <span
              title="이 공간에 설치된 기기들의 정격 소비전력 합계입니다. 절감량 계산의 기준값으로 쓰이므로 정확히 입력해주세요."
              style={{
                marginLeft: 6,
                fontSize: 11,
                color: "var(--blue)",
                border: "1px solid var(--blue)",
                borderRadius: "50%",
                width: 14,
                height: 14,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "help",
              }}
            >
              ?
            </span>
          </span>
          <input
            type="number"
            value={form.ratedPowerW}
            onChange={set("ratedPowerW")}
            required
            min={0}
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <Button type="button" variant="ghost" onClick={onClose} style={{ flex: 1 }}>
            취소
          </Button>
          <Button type="submit" loading={submitting} style={{ flex: 1 }}>
            {initial ? "수정" : "추가"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
