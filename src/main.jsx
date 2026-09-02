import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.jsx";

async function enableMocking() {
  // 목 서버는 개발 환경이거나 VITE_USE_MOCKS=true 일 때만 켠다.
  // 실제 백엔드가 준비되면 .env에서 이 플래그만 끄면 된다. (가이드 0.4)
  if (import.meta.env.VITE_USE_MOCKS !== "true") return;
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
