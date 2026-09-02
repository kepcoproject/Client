import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Cpu,
  Sparkles,
  FileBarChart2,
  History,
  Users,
  Settings,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/", label: "대시보드", end: true, icon: LayoutDashboard },
  { to: "/spaces", label: "공간", icon: Building2 },
  { to: "/devices", label: "디바이스", icon: Cpu },
  { to: "/recommendations", label: "추천", icon: Sparkles },
  { to: "/reports", label: "리포트", icon: FileBarChart2 },
  { to: "/control-logs", label: "제어 이력", icon: History },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  return (
    <>
      <div
        className={"sidebar-backdrop" + (open ? " open" : "")}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={"sidebar" + (open ? " open" : "")}>
        <div className="sidebar-brand">
          <span>스마트 에너지 절약 시스템</span>
          <button className="sidebar-close" onClick={onClose} aria-label="메뉴 닫기">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <nav className="sidebar-nav" onClick={onClose}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
            >
              <item.icon size={17} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
          {user?.role === "ADMIN" && (
            <NavLink
              to="/users"
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
            >
              <Users size={17} strokeWidth={2} />
              사용자 관리
            </NavLink>
          )}
        </nav>

        <NavLink to="/settings" className="nav-item nav-settings" onClick={onClose}>
          <Settings size={17} strokeWidth={2} />
          설정
        </NavLink>
      </aside>
    </>
  );
}
