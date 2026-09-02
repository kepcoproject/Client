import { apiClient } from "./client";

// C-02 노드 목록 (10초 폴링 대상)
export const getDevices = () => apiClient.get("/devices");

// C-03 노드 상세
export const getDevice = (deviceId) => apiClient.get(`/devices/${deviceId}`);

// C-01 노드 등록 - 응답의 deviceApiKey는 이때 딱 한 번만 내려온다
export const createDevice = (payload) => apiClient.post("/devices", payload);
