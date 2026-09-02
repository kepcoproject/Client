import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Zap } from "lucide-react";
import { useRecommendations } from "../hooks/useRecommendations";
import { useSpaces } from "../hooks/useSpaces";
import { applyRecommendation, rejectRecommendation } from "../api/recommendations";
import { formatEnergy, formatPercent } from "../utils/format";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import "./Dashboard.css";
import "./Recommendations.css";

const DAY_LABEL = { MON: "월", TUE: "화", WED: "수", THU: "목", FRI: "금", SAT: "토", SUN: "일" };
const TABS = [
  { key: "PENDING", label: "대기중" },
  { key: "APPLIED", label: "적용됨" },
  { key: "REJECTED", label: "반려됨" },
];

function formatDays(days) {
  return days.map((d) => DAY_LABEL[d]).join("·");
}

export default function Recommendations() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("PENDING");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useRecommendations();
  const { data: spacesData } = useSpaces({});
  const spaceMap = useMemo(
    () => new Map((spacesData?.items ?? []).map((s) => [s.spaceId, s])),
    [spacesData]
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["recommendations"] });

  const applyMutation = useMutation({
    mutationFn: applyRecommendation,
    onSuccess: () => {
      invalidate();
      setConfirmTarget(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }) => rejectRecommendation(id, comment),
    onSuccess: () => {
      invalidate();
      setRejectTarget(null);
      setComment("");
    },
  });

  const items = (data?.items ?? []).filter((r) => r.status === tab);
  const counts = useMemo(() => {
    const c = { PENDING: 0, APPLIED: 0, REJECTED: 0 };
    (data?.items ?? []).forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [data]);

  return (
    <div>
      <h1 className="page-title">절전 추천</h1>

      <div className="period-tabs" style={{ marginBottom: 22 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={"period-tab" + (t.key === tab ? " active" : "")}
            onClick={() => setTab(t.key)}
          >
            {t.label} {counts[t.key] ?? 0}
          </button>
        ))}
      </div>

      {isLoading && <div className="detail-meta">불러오는 중...</div>}
      {!isLoading && items.length === 0 && (
        <div className="detail-meta">해당 상태의 추천이 없습니다</div>
      )}

      <div className="rec-list">
        {items.map((rec) => {
          const space = spaceMap.get(rec.spaceId);
          const saving = formatEnergy(rec.expectedSavingWh);
          const pct = formatPercent(rec.confidence);
          return (
            <div className="rec-card" key={rec.recommendationId}>
              <div className="rec-head">
                <div>
                  <div className="rec-space">{space ? `${space.code} · ${space.name}` : rec.spaceId}</div>
                  <div className="rec-schedule">
                    {formatDays(rec.days)} {rec.startTime}~{rec.endTime}
                  </div>
                </div>
                <div className="rec-saving">
                  <Zap size={13} strokeWidth={2.3} />
                  {saving.value}
                  {saving.unit} 절감 예상
                </div>
              </div>

              <div className="rec-reason">
                <Sparkles size={14} strokeWidth={2.2} className="rec-reason-icon" />
                <div>
                  <div className="rec-reason-label">근거</div>
                  <div className="rec-reason-text">{rec.reason}</div>
                </div>
              </div>

              <div className="rec-confidence">
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="confidence-label">신뢰도 {pct}%</span>
              </div>

              {rec.status === "PENDING" && (
                <div className="rec-actions">
                  <Button variant="ghost" onClick={() => setRejectTarget(rec)}>
                    반려
                  </Button>
                  <Button onClick={() => setConfirmTarget(rec)}>적용</Button>
                </div>
              )}

              {rec.status === "APPLIED" && (
                <div className="rec-footnote applied">스케줄 적용됨 · {rec.scheduleId}</div>
              )}

              {rec.status === "REJECTED" && rec.comment && (
                <div className="rec-footnote">반려 사유: {rec.comment}</div>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="추천 적용"
        width={420}
      >
        {confirmTarget && (
          <>
            <p className="confirm-text">
              매주 {formatDays(confirmTarget.days)} {confirmTarget.startTime}에{" "}
              <strong>{spaceMap.get(confirmTarget.spaceId)?.code}</strong>{" "}
              {confirmTarget.actionLabel}. 적용할까요?
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Button variant="ghost" onClick={() => setConfirmTarget(null)} style={{ flex: 1 }}>
                취소
              </Button>
              <Button
                onClick={() => applyMutation.mutate(confirmTarget.recommendationId)}
                loading={applyMutation.isPending}
                style={{ flex: 1 }}
              >
                적용
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setComment("");
        }}
        title="추천 반려"
        width={420}
      >
        {rejectTarget && (
          <>
            <label className="field">
              <span>반려 사유 (학습 피드백으로 반영됩니다)</span>
              <textarea
                className="reject-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="예: 주말 당직 근무가 비정기적으로 있어 보류합니다"
                rows={3}
              />
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Button
                variant="ghost"
                onClick={() => {
                  setRejectTarget(null);
                  setComment("");
                }}
                style={{ flex: 1 }}
              >
                취소
              </Button>
              <Button
                onClick={() =>
                  rejectMutation.mutate({ id: rejectTarget.recommendationId, comment })
                }
                loading={rejectMutation.isPending}
                disabled={!comment.trim()}
                style={{ flex: 1 }}
              >
                반려
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
