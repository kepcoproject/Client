import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { getSpace } from "../api/spaces";
import { getPowerHistory } from "../api/telemetry";
import { useDevices } from "../hooks/useDevices";
import Badge from "../components/common/Badge";
import { formatPower } from "../utils/format";
import ControlPanel from "./ControlPanel";
import "./Dashboard.css";
import "./SpaceDetail.css";

const PERIODS = [
  { key: "1h", label: "1시간", hours: 1, interval: "1m" },
  { key: "6h", label: "6시간", hours: 6, interval: "10m" },
  { key: "24h", label: "24시간", hours: 24, interval: "10m" },
  { key: "7d", label: "7일", hours: 168, interval: "1h" },
];

const STATUS_TONE = { ONLINE: "green", OFFLINE: "neutral", ERROR: "red" };
const STATUS_LABEL = { ONLINE: "온라인", OFFLINE: "오프라인", ERROR: "오류" };

function formatTick(ms, periodKey) {
  const d = new Date(ms);
  if (periodKey === "7d") {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function SpaceDetail() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [periodKey, setPeriodKey] = useState("24h");
  const period = PERIODS.find((p) => p.key === periodKey);

  const { data: space } = useQuery({
    queryKey: ["space", spaceId],
    queryFn: () => getSpace(spaceId),
  });

  const { data: history, isLoading } = useQuery({
    queryKey: ["power-history", spaceId, period.interval, period.hours],
    queryFn: () => getPowerHistory(spaceId, { interval: period.interval, hours: period.hours }),
  });

  const { data: devicesData } = useDevices();
  const nodes = (devicesData?.items ?? []).filter((d) => d.spaceId === spaceId);
  const actuators = [...new Set(nodes.flatMap((n) => n.actuators || []))];

  const chartData = (history?.points ?? []).map((p) => ({
    tMs: new Date(p.t).getTime(),
    powerW: p.powerW,
  }));
  const occupiedPeriods = history?.occupiedPeriods ?? [];
  const domainStart = chartData[0]?.tMs;
  const domainEnd = chartData[chartData.length - 1]?.tMs;
  const rated = space ? formatPower(space.ratedPowerW) : null;

  return (
    <div>
      <button className="back-link" onClick={() => navigate("/spaces")}>
        <ArrowLeft size={15} strokeWidth={2.2} />
        공간 목록
      </button>

      <div className="detail-head">
        <h1 className="page-title" style={{ marginBottom: 6 }}>
          {space ? `${space.code} · ${space.name}` : spaceId}
        </h1>
        {space && (
          <div className="detail-meta">
            {space.building} {space.floor}층 · 정격 {rated.value}
            {rated.unit} · 현재 상태 <span className="status-strong">{space.status}</span>
          </div>
        )}
      </div>

      <div className="node-list">
        {nodes.map((n) => (
          <Badge key={n.deviceId} tone={STATUS_TONE[n.status]} dot>
            {n.deviceId} · {STATUS_LABEL[n.status]}
          </Badge>
        ))}
        {nodes.length === 0 && <span className="detail-meta">연결된 노드가 없습니다</span>}
      </div>

      <div className="chart-card">
        <div className="period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={"period-tab" + (p.key === periodKey ? " active" : "")}
              onClick={() => setPeriodKey(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="chart-area">
          {isLoading || chartData.length === 0 ? (
            <div className="chart-empty">불러오는 중...</div>
          ) : (
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="tMs"
                  type="number"
                  scale="time"
                  domain={[domainStart, domainEnd]}
                  tickFormatter={(v) => formatTick(v, periodKey)}
                  tick={{ fontSize: 11, fill: "#86868B" }}
                  axisLine={{ stroke: "#E5E5E7" }}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#86868B" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  unit="W"
                />
                <Tooltip
                  labelFormatter={(v) => new Date(v).toLocaleString("ko-KR")}
                  formatter={(value) => [value == null ? "데이터 없음" : `${value}W`, "전력"]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #E5E5E7",
                    fontSize: 12,
                  }}
                />
                {occupiedPeriods.map((p, i) => (
                  <ReferenceArea
                    key={i}
                    x1={new Date(p.start).getTime()}
                    x2={new Date(p.end).getTime()}
                    fill="#0071E3"
                    fillOpacity={0.09}
                    stroke="none"
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="powerW"
                  stroke="#0071E3"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-swatch" />
            재실 구간
          </span>
          <span className="legend-hint">음영이 없는데 선이 높으면 공실 낭비 구간입니다</span>
        </div>
      </div>

      <ControlPanel spaceId={spaceId} actuators={actuators} />
    </div>
  );
}
