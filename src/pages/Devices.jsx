import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import { useDevices } from "../hooks/useDevices";
import { useSpaces } from "../hooks/useSpaces";
import { createDevice, deleteDevice } from "../api/devices";
import { ApiError } from "../api/client";
import { formatRelativeTime } from "../utils/format";
import DeviceFormModal from "./DeviceFormModal";
import ApiKeyRevealModal from "./ApiKeyRevealModal";
import "./Dashboard.css";
import "./Spaces.css";

const STATUS_TONE = { ONLINE: "green", OFFLINE: "neutral", ERROR: "red" };
const STATUS_LABEL = { ONLINE: "온라인", OFFLINE: "오프라인", ERROR: "오류" };

export default function Devices() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useDevices();
  const { data: spacesData } = useSpaces({});
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [revealKey, setRevealKey] = useState(null);
  const [rowError, setRowError] = useState("");

  const spaces = spacesData?.items ?? [];
  const spaceMap = useMemo(() => new Map(spaces.map((s) => [s.spaceId, s])), [spaces]);

  const createMutation = useMutation({
    mutationFn: createDevice,
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      setModalOpen(false);
      setFormError("");
      setRevealKey(device.deviceApiKey);
    },
    onError: () => setFormError("노드 등록에 실패했습니다"),
  });

  const handleCreate = (payload, resetForm) => {
    setFormError("");
    createMutation.mutate(payload, { onSuccess: () => resetForm?.() });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      // 공간의 노드 수가 줄어든다. 마지막 노드를 지우면 그 공간도 삭제할 수 있게 된다.
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      setRowError("");
    },
    // 관리자가 아니면 서버가 사유를 알려준다
    onError: (err) =>
      setRowError(
        err instanceof ApiError && err.message ? err.message : "노드 삭제에 실패했습니다"
      ),
  });

  const handleDelete = (row) => {
    // 측정 기록까지 지워져 되돌릴 수 없으니 한 번 더 묻는다
    const confirmed = window.confirm(
      `${row.deviceId} 노드를 삭제할까요?\n\n` +
        "이 노드가 보낸 측정 기록도 함께 지워지고 되돌릴 수 없습니다.\n" +
        "노드 전원이 켜져 있으면 다음 데이터가 들어올 때 다시 등록됩니다."
    );
    if (confirmed) deleteMutation.mutate(row.deviceId);
  };

  const columns = [
    { key: "deviceId", header: "노드 ID" },
    {
      key: "space",
      header: "소속 공간",
      render: (row) => {
        const s = spaceMap.get(row.spaceId);
        return s ? `${s.code} · ${s.name}` : row.spaceId;
      },
    },
    {
      key: "status",
      header: "상태",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.status]} dot>
          {STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    { key: "signalStrength", header: "신호강도", render: (row) => `${row.signalStrength} dBm` },
    { key: "firmware", header: "펌웨어" },
    {
      key: "lastSeenAt",
      header: "마지막 수신",
      render: (row) => formatRelativeTime(row.lastSeenAt),
    },
    {
      key: "actions",
      header: "",
      width: 80,
      render: (row) => (
        <button
          className="link-btn danger"
          onClick={() => handleDelete(row)}
          disabled={deleteMutation.isPending}
        >
          <Trash2 size={13} strokeWidth={2.2} />
          삭제
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-head-row">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          디바이스 관리
        </h1>
        <Button onClick={() => setModalOpen(true)} icon={Plus}>노드 추가</Button>
      </div>

      {rowError && (
        <div className="login-error" style={{ marginTop: 14 }}>
          {rowError}
        </div>
      )}

      <Table
        columns={columns}
        rows={data?.items ?? []}
        rowKey="deviceId"
        emptyMessage={isLoading ? "불러오는 중..." : "등록된 노드가 없습니다"}
      />

      <DeviceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        spaces={spaces}
        submitting={createMutation.isPending}
        error={formError}
      />

      <ApiKeyRevealModal
        open={!!revealKey}
        apiKey={revealKey}
        onClose={() => setRevealKey(null)}
      />
    </div>
  );
}
