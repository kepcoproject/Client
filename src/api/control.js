import { apiClient } from "./client";

// G-01 수동 제어 - 응답은 202 Accepted, status: 'PENDING'.
// "명령을 접수했다"이지 "실행됐다"가 아니므로 반드시 폴링으로 결과를 확인해야 한다.
export const postControl = (spaceId, payload) =>
  apiClient.post("/control/commands", { spaceId, ...payload });

// 명령 상태 폴링 (G-01 응답의 commandId로 조회)
export const getCommandStatus = (commandId) => apiClient.get(`/control/commands/${commandId}`);

// G-04 제어 이력
export const getControlLogs = () => apiClient.get("/control/logs");
