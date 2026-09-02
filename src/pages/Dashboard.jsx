import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Zap, AlertTriangle, Leaf, TrendingDown } from "lucide-react";
import { getOccupancyMap, getRealtimePower, getSavings } from "../api/monitoring";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
import { formatPower, formatEnergy, formatPercent } from "../utils/format";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: power } = useQuery({
    queryKey: ["realtime-power"],
    queryFn: getRealtimePower,
    refetchInterval: 5000,
  });

  const { data: occupancy } = useQuery({
    queryKey: ["occupancy-map"],
    queryFn: getOccupancyMap,
    refetchInterval: 5000,
    keepPreviousData: true,
  });

  const { data: savings } = useQuery({
    queryKey: ["savings"],
    queryFn: getSavings,
    refetchInterval: 30000,
  });

  const spaces = occupancy?.spaces ?? [];
  const wasteCount = spaces.filter((s) => s.wasteFlag).length;

  const current = power ? formatPower(power.totalW) : null;
  const waste = power ? formatPower(power.wasteW) : null;
  const savedEnergy = savings ? formatEnergy(savings.todaySavingWh) : null;
  const savingRate = savings ? formatPercent(savings.savingRate) : null;

  return (
    <div>
      <h1 className="page-title">대시보드</h1>

      <div className="stats-grid">
        <StatCard label="현재 전력" value={current?.value ?? "–"} unit={current?.unit} icon={Zap} />
        <StatCard
          label="낭비 전력"
          value={waste?.value ?? "–"}
          unit={waste?.unit}
          tone={power?.wasteW > 0 ? "warn" : undefined}
          icon={AlertTriangle}
        />
        <StatCard
          label="오늘 절감"
          value={savedEnergy?.value ?? "–"}
          unit={savedEnergy?.unit}
          tone="good"
          icon={Leaf}
        />
        <StatCard label="절감률" value={savingRate ?? "–"} unit="%" tone="good" icon={TrendingDown} />
      </div>

      <div className="section-head">
        <h2>공간별 재실 현황</h2>
        {wasteCount > 0 && (
          <div className="waste-meta">
            <AlertTriangle size={13} strokeWidth={2.3} />
            낭비 감지 {wasteCount}건
          </div>
        )}
      </div>

      <div className="rooms-grid">
        {spaces.map((s) => {
          const p = formatPower(s.powerW);
          return (
            <button
              key={s.spaceId}
              className={"room-card" + (s.wasteFlag ? " waste" : "")}
              onClick={() => navigate(`/spaces/${s.spaceId}`)}
            >
              <div className="room-top">
                <div className="room-name">{s.code}</div>
                <Badge tone={s.occupied ? "blue" : "neutral"}>{s.occupied ? "재실" : "공실"}</Badge>
              </div>
              <div className="room-power">
                {p.value}
                <small>{p.unit}</small>
              </div>
              {s.wasteFlag && (
                <div className="warn-tag">
                  <AlertTriangle size={12} strokeWidth={2.3} />
                  공실인데 전력 사용 중
                </div>
              )}
            </button>
          );
        })}
        {spaces.length === 0 && <div className="empty-state">등록된 공간이 없습니다</div>}
      </div>
    </div>
  );
}
