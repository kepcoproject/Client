import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronDown, LogOut, Info, AlertTriangle, OctagonAlert, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getNotifications } from "../../api/notifications";
import { formatRelativeTime } from "../../utils/format";
import "./Header.css";

function formatClock(date) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = days[date.getDay()];
  let h = date.getHours();
  const ampm = h < 12 ? "오전" : "오후";
  h = h % 12 || 12;
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${m}월 ${d}일 (${day}) · ${ampm} ${h}:${min}`;
}

const LEVEL_ICON = { INFO: Info, WARNING: AlertTriangle, CRITICAL: OctagonAlert };
const LEVEL_CLASS = { INFO: "level-info", WARNING: "level-warning", CRITICAL: "level-critical" };

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [now, setNow] = useState(new Date());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const userMenuRef = useRef(null);
  const bellRef = useRef(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const notifications = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuClick} aria-label="메뉴 열기">
          <Menu size={20} strokeWidth={2} />
        </button>
        <div className="header-clock">{formatClock(now)}</div>
      </div>

      <div className="header-actions">
        <div className="bell-menu" ref={bellRef}>
          <button
            className="icon-btn bell-btn"
            aria-label="알림"
            onClick={() => setBellOpen((v) => !v)}
          >
            <Bell size={18} strokeWidth={1.8} />
            {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
          </button>
          {bellOpen && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-title">알림</div>
              {notifications.length === 0 && (
                <div className="notif-empty">새로운 알림이 없습니다</div>
              )}
              {notifications.map((n) => {
                const Icon = LEVEL_ICON[n.level] ?? Info;
                return (
                  <div
                    key={n.notificationId}
                    className={"notif-item" + (n.read ? "" : " unread")}
                  >
                    <Icon size={15} strokeWidth={2.1} className={LEVEL_CLASS[n.level]} />
                    <div>
                      <div className="notif-message">{n.message}</div>
                      <div className="notif-time">{formatRelativeTime(n.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="user-menu" ref={userMenuRef}>
          <button className="icon-btn user-trigger" onClick={() => setUserMenuOpen((v) => !v)}>
            <span className="avatar">{user?.name?.[0] ?? "?"}</span>
            <span className="user-name">{user?.name ?? "게스트"}</span>
            <ChevronDown size={14} strokeWidth={2} className="chevron" />
          </button>
          {userMenuOpen && (
            <div className="user-dropdown">
              <button onClick={logout}>
                <LogOut size={15} strokeWidth={1.8} />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
