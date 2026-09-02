import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import { useDevices } from "../hooks/useDevices";
import { useSpaces } from "../hooks/useSpaces";
import { createDevice } from "../api/devices";
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
  ];

  return (
    <div>
      <div className="page-head-row">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          디바이스 관리
        </h1>
        <Button onClick={() => setModalOpen(true)} icon={Plus}>노드 추가</Button>
      </div>

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
