import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Leaf, Coins, TreePine } from "lucide-react";
import { getSavingReport } from "../api/reports";
import { useSpaces } from "../hooks/useSpaces";
import Table from "../components/common/Table";
import StatCard from "../components/common/StatCard";
import { formatEnergy, formatCurrency, formatPercent } from "../utils/format";
import "./Dashboard.css";
import "./Recommendations.css";
import "./SpaceDetail.css";
import "./Reports.css";

const PERIODS = [
  { key: "day", label: "일별" },
  { key: "week", label: "주별" },
  { key: "month", label: "월별" },
];

// 나무 1그루가 흡수하는 연간 CO2량 예시값(약 6.6kg/년, 산림청 자료 기준으로 널리 쓰이는 수치).
// 데모용 환산이므로 실제 리포트에서는 최신 고시 자료로 교체 권장.
const CO2_PER_TREE_KG = 6.6;

function formatDateLabel(iso, period) {
  const d = new Date(iso);
  if (period === "month") return `${d.getFullYear()}.${d.getMonth() + 1}`;
  if (period === "week") return `${d.getMonth() + 1}/${d.getDate()}주~`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function Reports() {
  const [period, setPeriod] = useState("day");
  const [spaceId, setSpaceId] = useState("");

  const { data: spacesData } = useSpaces({});
  const spaces = spacesData?.items ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["report", period, spaceId],
    queryFn: () => getSavingReport({ period, spaceId: spaceId || undefined }),
  });

  const items = data?.items ?? [];
  const chartData = items.map((it) => ({
    label: formatDateLabel(it.date, period),
    usageKWh: Math.round((it.usageWh / 1000) * 10) / 10,
    baselineKWh: Math.round((it.baselineWh / 1000) * 10) / 10,
  }));

  const summary = data?.summary;
  const savedEnergy = summary ? formatEnergy(summary.totalSavingWh) : null;
  const trees = summary ? Math.round((summary.co2ReductionKg / CO2_PER_TREE_KG) * 10) / 10 : null;

  const columns = [
    { key: "date", header: "날짜", render: (row) => formatDateLabel(row.date, period) },
    {
      key: "usageWh",
      header: "사용량",
      render: (row) => `${formatEnergy(row.usageWh).value}${formatEnergy(row.usageWh).unit}`,
    },
    {
      key: "baselineWh",
      header: "기준선",
      render: (row) => `${formatEnergy(row.baselineWh).value}${formatEnergy(row.baselineWh).unit}`,
    },
    {
      key: "saving",
      header: "절감",
      render: (row) => {
        const saved = row.baselineWh - row.usageWh;
        return `${formatEnergy(saved).value}${formatEnergy(saved).unit}`;
      },
    },
  ];

  return (
    <div>
      <div className="page-head-row">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          리포트
        </h1>
      </div>

      <div className="report-controls">
        <div className="period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={"period-tab" + (p.key === period ? " active" : "")}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <select className="filter-select" value={spaceId} onChange={(e) => setSpaceId(e.target.value)}>
          <option value="">전체 공간</option>
          {spaces.map((s) => (
            <option key={s.spaceId} value={s.spaceId}>
              {s.code} · {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="chart-card" style={{ marginTop: 18, marginBottom: 20 }}>
        <div className="chart-area">
          {isLoading || chartData.length === 0 ? (
            <div className="chart-empty">불러오는 중...</div>
          ) : (
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E5E5E7" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#86868B" }}
                  axisLine={{ stroke: "#E5E5E7" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#86868B" }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  unit="kWh"
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${value}kWh`,
                    name === "usageKWh" ? "사용량" : "기준선",
                  ]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #E5E5E7", fontSize: 12 }}
                />
                <Bar dataKey="usageKWh" fill="#0071E3" radius={[4, 4, 0, 0]} barSize={22} />
                <Line
                  type="monotone"
                  dataKey="baselineKWh"
                  stroke="#86868B"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: "#0071E3", border: "none" }} />
            사용량
          </span>
          <span className="legend-item">
            <span
              className="legend-swatch"
              style={{ background: "none", border: "2px dashed #86868B" }}
            />
            기준선(baseline)
          </span>
        </div>
      </div>

      {summary && (
        <>
          <div className="stats-grid stats-grid-3">
            <StatCard
              label="총 절감량"
              value={savedEnergy.value}
              unit={`${savedEnergy.unit} (${formatPercent(summary.savingRate)}%)`}
              tone="good"
              icon={Leaf}
            />
            <StatCard
              label="절감 금액"
              value={formatCurrency(summary.savingCost).replace("원", "")}
              unit="원"
              tone="good"
              icon={Coins}
            />
            <StatCard
              label="CO₂ 감축량"
              value={summary.co2ReductionKg}
              unit="kg"
              tone="good"
              icon={TreePine}
            />
          </div>
          <div className="report-footnote">
            나무 약 {trees}그루가 1년간 흡수하는 양과 비슷해요. CO₂ 환산은 전력 배출계수
            0.4781kgCO₂/kWh(한국전력 평균 배출계수 예시값), 나무 1그루당 연간 흡수량 6.6kg(산림청
            통계 기준 통용값)을 사용한 추정치이며, 실제 리포트에서는 최신 고시 계수로 교체해야
            합니다.
          </div>
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          rows={items}
          rowKey="date"
          emptyMessage={isLoading ? "불러오는 중..." : "데이터가 없습니다"}
        />
      </div>
    </div>
  );
}
