import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./AppLayout.css";

export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="app-main">
        <Header onMenuClick={() => setNavOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
