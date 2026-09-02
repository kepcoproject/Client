import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus } from "lucide-react";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import { useSpaces } from "../hooks/useSpaces";
import { createSpace, updateSpace, deleteSpace } from "../api/spaces";
import { ApiError } from "../api/client";
import SpaceFormModal from "./SpaceFormModal";
import "./Dashboard.css";
import "./Spaces.css";

export default function Spaces() {
  const queryClient = useQueryClient();
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");
  const [rowError, setRowError] = useState(null); // { spaceId, message }

  // 필터 옵션 구성을 위한 전체 목록
  const { data: allData } = useSpaces({});
  const { data, isLoading } = useSpaces({ building, floor });

  const buildings = useMemo(
    () => [...new Set((allData?.items ?? []).map((s) => s.building))],
    [allData]
  );
  const floors = useMemo(
    () => [...new Set((allData?.items ?? []).map((s) => s.floor))].sort((a, b) => a - b),
    [allData]
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["spaces"] });

  const createMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
    },
    onError: () => setFormError("공간 등록에 실패했습니다"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ spaceId, payload }) => updateSpace(spaceId, payload),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
    },
    onError: () => setFormError("공간 수정에 실패했습니다"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSpace,
    onSuccess: () => {
      invalidate();
      setRowError(null);
    },
    onError: (err, spaceId) => {
      if (err instanceof ApiError && err.code === "E4090") {
        setRowError({ spaceId, message: "연결된 센서 노드를 먼저 해제하세요" });
      } else {
        setRowError({ spaceId, message: "삭제에 실패했습니다" });
      }
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (space) => {
    setEditing(space);
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = (payload) => {
    setFormError("");
    if (editing) {
      updateMutation.mutate({ spaceId: editing.spaceId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    { key: "code", header: "공간코드" },
    { key: "name", header: "이름" },
    { key: "building", header: "건물" },
    { key: "floor", header: "층" },
    { key: "nodeCount", header: "노드 수" },
    { key: "status", header: "현재 상태" },
    {
      key: "actions",
      header: "",
      width: 140,
      render: (row) => (
        <div style={{ display: "flex", gap: 4 }}>
          <button className="link-btn" onClick={() => openEdit(row)}>
            <Pencil size={13} strokeWidth={2.2} />
            수정
          </button>
          <button
            className="link-btn danger"
            onClick={() => deleteMutation.mutate(row.spaceId)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={13} strokeWidth={2.2} />
            삭제
          </button>
        </div>
      ),
    },
  ];

  const rows = data?.items ?? [];

  return (
    <div>
      <div className="page-head-row">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          공간 관리
        </h1>
        <Button onClick={openCreate} icon={Plus}>공간 추가</Button>
      </div>

      <div className="filter-bar">
        <select value={building} onChange={(e) => setBuilding(e.target.value)}>
          <option value="">전체 건물</option>
          {buildings.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select value={floor} onChange={(e) => setFloor(e.target.value)}>
          <option value="">전체 층</option>
          {floors.map((f) => (
            <option key={f} value={f}>
              {f}층
            </option>
          ))}
        </select>
      </div>

      {rowError && (
        <div className="login-error" style={{ marginTop: 14 }}>
          {rowError.message}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          rows={rows}
          rowKey="spaceId"
          emptyMessage={isLoading ? "불러오는 중..." : "등록된 공간이 없습니다"}
        />
      </div>

      <SpaceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        submitting={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />
    </div>
  );
}
