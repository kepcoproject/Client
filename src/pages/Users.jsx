import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import { getUsers, updateUserStatus } from "../api/users";
import "./Dashboard.css";
import "./Spaces.css";

const ROLE_LABEL = { ADMIN: "관리자", MEMBER: "일반" };
const STATUS_TONE = { ACTIVE: "green", PENDING: "neutral" };
const STATUS_LABEL = { ACTIVE: "활성", PENDING: "승인 대기" };

export default function Users() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: getUsers });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const approveMutation = useMutation({
    mutationFn: (userId) => updateUserStatus(userId, { status: "ACTIVE" }),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: (userId) => updateUserStatus(userId, { status: "REJECTED" }),
    onSuccess: invalidate,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserStatus(userId, { role }),
    onSuccess: invalidate,
  });

  const users = (data?.items ?? []).filter((u) => u.status !== "REJECTED");
  const pending = users.filter((u) => u.status === "PENDING");
  const active = users.filter((u) => u.status === "ACTIVE");

  const activeColumns = [
    { key: "loginId", header: "아이디" },
    { key: "name", header: "이름" },
    { key: "email", header: "이메일" },
    {
      key: "role",
      header: "권한",
      render: (row) => (
        <select
          className="role-select"
          value={row.role}
          onChange={(e) => roleMutation.mutate({ userId: row.userId, role: e.target.value })}
        >
          <option value="MEMBER">일반</option>
          <option value="ADMIN">관리자</option>
        </select>
      ),
    },
    {
      key: "status",
      header: "상태",
      render: (row) => <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>,
    },
  ];

  const pendingColumns = [
    { key: "loginId", header: "아이디" },
    { key: "name", header: "이름" },
    { key: "email", header: "이메일" },
    {
      key: "requestedAt",
      header: "신청일",
      render: (row) => new Date(row.requestedAt).toLocaleDateString("ko-KR"),
    },
    {
      key: "actions",
      header: "",
      width: 160,
      render: (row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button
            variant="ghost"
            onClick={() => rejectMutation.mutate(row.userId)}
            style={{ height: 32, padding: "0 12px", fontSize: 12.5 }}
          >
            <X size={13} strokeWidth={2.2} />
            거절
          </Button>
          <Button
            onClick={() => approveMutation.mutate(row.userId)}
            style={{ height: 32, padding: "0 12px", fontSize: 12.5 }}
          >
            <Check size={13} strokeWidth={2.2} />
            승인
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="page-title">사용자 관리</h1>

      <div className="section-head" style={{ margin: "0 0 14px" }}>
        <h2>승인 대기 {pending.length > 0 && `· ${pending.length}건`}</h2>
      </div>
      <Table
        columns={pendingColumns}
        rows={pending}
        rowKey="userId"
        emptyMessage={isLoading ? "불러오는 중..." : "승인 대기 중인 신청이 없습니다"}
      />

      <div className="section-head">
        <h2>전체 사용자</h2>
      </div>
      <Table columns={activeColumns} rows={active} rowKey="userId" />
    </div>
  );
}
