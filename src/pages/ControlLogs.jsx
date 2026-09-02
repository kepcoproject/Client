import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import { useSpaces } from "../hooks/useSpaces";
import { getControlLogs } from "../api/control";
import "./Dashboard.css";

const ACTION_LABEL = {
  LIGHT: { ON: "조명 켜기", OFF: "조명 끄기" },
  VENT: { OPEN: "환기구 열기", CLOSE: "환기구 닫기" },
};

const TRIGGER_TONE = { AUTO: "green", MANUAL: "neutral" };
const TRIGGER_LABEL = { AUTO: "자동", MANUAL: "수동" };
const RESULT_TONE = { COMPLETED: "green", FAILED: "red", PENDING: "neutral" };
const RESULT_LABEL = { COMPLETED: "완료", FAILED: "실패", PENDING: "대기" };

export default function ControlLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["control-logs"],
    queryFn: getControlLogs,
    refetchInterval: 8000,
  });
  const { data: spacesData } = useSpaces({});

  const spaceMap = useMemo(
    () => new Map((spacesData?.items ?? []).map((s) => [s.spaceId, s])),
    [spacesData]
  );

  const columns = [
    {
      key: "timestamp",
      header: "시각",
      render: (row) => new Date(row.timestamp).toLocaleString("ko-KR"),
    },
    {
      key: "space",
      header: "공간",
      render: (row) => spaceMap.get(row.spaceId)?.code ?? row.spaceId,
    },
    {
      key: "command",
      header: "명령",
      render: (row) => ACTION_LABEL[row.action]?.[row.value] ?? `${row.action} ${row.value}`,
    },
    {
      key: "trigger",
      header: "트리거",
      render: (row) => <Badge tone={TRIGGER_TONE[row.trigger]}>{TRIGGER_LABEL[row.trigger]}</Badge>,
    },
    {
      key: "result",
      header: "결과",
      render: (row) => <Badge tone={RESULT_TONE[row.result]}>{RESULT_LABEL[row.result]}</Badge>,
    },
  ];

  return (
    <div>
      <h1 className="page-title">제어 이력</h1>
      <Table
        columns={columns}
        rows={data?.items ?? []}
        rowKey="logId"
        emptyMessage={isLoading ? "불러오는 중..." : "제어 이력이 없습니다"}
      />
    </div>
  );
}
