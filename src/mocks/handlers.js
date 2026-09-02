import { http, HttpResponse } from "msw";

const ok = (data) => HttpResponse.json({ success: true, data, error: null });
const accepted = (data) => HttpResponse.json({ success: true, data, error: null }, { status: 202 });
const fail = (status, code, message) =>
  HttpResponse.json(
    { success: false, data: null, error: { code, message } },
    { status }
  );

// 센서 데이터에 랜덤 변동을 줘서 그래프가 살아 움직이게 (가이드 0.4)
const mockPower = (base) => Math.max(0, Math.round(base + (Math.random() - 0.5) * 40));

const ROOMS = [
  { spaceId: "sp-1", code: "A301", name: "3층 회의실", floor: 3, occupied: false, base: 300 },
  { spaceId: "sp-2", code: "A302", name: "3층 사무실", floor: 3, occupied: true, base: 400 },
  { spaceId: "sp-3", code: "A303", name: "3층 라운지", floor: 3, occupied: false, base: 0 },
  { spaceId: "sp-4", code: "B101", name: "1층 회의실", floor: 1, occupied: false, base: 280 },
  { spaceId: "sp-5", code: "B102", name: "1층 사무실", floor: 1, occupied: true, base: 500 },
  { spaceId: "sp-6", code: "B103", name: "1층 사무실", floor: 1, occupied: true, base: 340 },
];

let accessSeq = 0;

// --- 공간 관리 (B-01~B-05) 인메모리 목 데이터 ---
let SPACES = [
  { spaceId: "sp-1", code: "A301", name: "3층 회의실", building: "A동", floor: 3, nodeCount: 2, ratedPowerW: 800, status: "정상" },
  { spaceId: "sp-2", code: "A302", name: "3층 사무실", building: "A동", floor: 3, nodeCount: 3, ratedPowerW: 1200, status: "정상" },
  { spaceId: "sp-3", code: "A303", name: "3층 라운지", building: "A동", floor: 3, nodeCount: 1, ratedPowerW: 400, status: "정상" },
  { spaceId: "sp-4", code: "B101", name: "1층 회의실", building: "B동", floor: 1, nodeCount: 2, ratedPowerW: 700, status: "정상" },
  { spaceId: "sp-5", code: "B102", name: "1층 사무실", building: "B동", floor: 1, nodeCount: 4, ratedPowerW: 1500, status: "정상" },
  { spaceId: "sp-6", code: "B103", name: "1층 사무실", building: "B동", floor: 1, nodeCount: 2, ratedPowerW: 900, status: "정상" },
];
let spaceSeq = SPACES.length;

// --- 디바이스 관리 (C-01~C-03) 인메모리 목 데이터 ---
let DEVICES = [
  { deviceId: "NODE-A301-01", spaceId: "sp-1", sensors: ["PIR", "CURRENT"], actuators: ["LIGHT"], status: "ONLINE", signalStrength: -52, firmware: "v1.4.2", lastSeenAt: new Date().toISOString() },
  { deviceId: "NODE-A302-01", spaceId: "sp-2", sensors: ["PIR", "LUX", "CURRENT"], actuators: ["LIGHT", "VENT"], status: "ONLINE", signalStrength: -61, firmware: "v1.4.2", lastSeenAt: new Date().toISOString() },
  { deviceId: "NODE-A303-01", spaceId: "sp-3", sensors: ["PIR"], actuators: ["LIGHT"], status: "OFFLINE", signalStrength: -88, firmware: "v1.3.0", lastSeenAt: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
  { deviceId: "NODE-B101-01", spaceId: "sp-4", sensors: ["PIR", "CURRENT"], actuators: ["LIGHT"], status: "ERROR", signalStrength: -70, firmware: "v1.4.0", lastSeenAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { deviceId: "NODE-B102-01", spaceId: "sp-5", sensors: ["PIR", "LUX", "CURRENT"], actuators: ["LIGHT", "VENT"], status: "ONLINE", signalStrength: -55, firmware: "v1.4.2", lastSeenAt: new Date().toISOString() },
];
let deviceSeq = DEVICES.length;

// --- 제어 패널 · 이력 (G-01, G-04) 인메모리 목 데이터 ---
let COMMANDS = [];
let commandSeq = 0;
let CONTROL_LOGS = [
  { logId: "log-1", timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), spaceId: "sp-2", action: "LIGHT", value: "OFF", trigger: "AUTO", result: "COMPLETED" },
  { logId: "log-2", timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(), spaceId: "sp-5", action: "LIGHT", value: "ON", trigger: "MANUAL", result: "COMPLETED" },
  { logId: "log-3", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), spaceId: "sp-1", action: "VENT", value: "CLOSE", trigger: "AUTO", result: "COMPLETED" },
  { logId: "log-4", timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), spaceId: "sp-4", action: "LIGHT", value: "OFF", trigger: "MANUAL", result: "FAILED" },
];
let logSeq = CONTROL_LOGS.length;

// --- 절전 추천 (F-01, F-02) 인메모리 목 데이터 ---
let RECOMMENDATIONS = [
  {
    recommendationId: "rec-1",
    spaceId: "sp-2",
    days: ["MON", "WED", "FRI"],
    startTime: "12:10",
    endTime: "13:00",
    action: "LIGHT_OFF",
    actionLabel: "조명이 자동으로 꺼집니다",
    reason: "최근 4주간 해당 시간대 공실 비율 92%",
    confidence: 0.92,
    expectedSavingWh: 850,
    status: "PENDING",
    scheduleId: null,
    comment: null,
  },
  {
    recommendationId: "rec-2",
    spaceId: "sp-4",
    days: ["TUE", "THU"],
    startTime: "09:00",
    endTime: "09:40",
    action: "VENT_CLOSE",
    actionLabel: "환기구가 자동으로 닫힙니다",
    reason: "최근 3주간 화·목 오전 첫 회의가 없었던 주 78%, 평균 공실 시간 38분",
    confidence: 0.78,
    expectedSavingWh: 420,
    status: "PENDING",
    scheduleId: null,
    comment: null,
  },
  {
    recommendationId: "rec-3",
    spaceId: "sp-6",
    days: ["MON", "TUE", "WED", "THU", "FRI"],
    startTime: "18:30",
    endTime: "23:59",
    action: "LIGHT_OFF",
    actionLabel: "조명이 자동으로 꺼집니다",
    reason: "퇴근 시간(18:30) 이후 재실 감지 비율 3% 미만 (최근 4주 평균)",
    confidence: 0.97,
    expectedSavingWh: 1200,
    status: "APPLIED",
    scheduleId: "sch-1",
    comment: null,
  },
  {
    recommendationId: "rec-4",
    spaceId: "sp-3",
    days: ["SAT", "SUN"],
    startTime: "00:00",
    endTime: "23:59",
    action: "LIGHT_OFF",
    actionLabel: "조명이 자동으로 꺼집니다",
    reason: "주말 재실 이력 없음 (최근 8주 연속)",
    confidence: 0.99,
    expectedSavingWh: 300,
    status: "REJECTED",
    scheduleId: null,
    comment: "주말 당직 근무가 비정기적으로 있어 자동 차단은 보류합니다",
  },
];
let scheduleSeq = 1;

// --- 리포트 (H-01) ---
const REPORT_BUCKETS = { day: 14, week: 8, month: 6 };
const PRICE_PER_KWH = 120; // 예시 산업용 평균 단가(원). 실제 리포트에서는 계약 요금제 값으로 교체 필요
const CO2_FACTOR_KG_PER_KWH = 0.4781; // 한국전력 평균 배출계수 예시값(2022년 발표 기준). 최신 고시값으로 교체 권장

// --- 알림 (H-02) 인메모리 목 데이터 ---
let NOTIFICATIONS = [
  { notificationId: "ntf-1", level: "WARNING", message: "A301 공실인데 315W 전력 소비 중입니다", createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(), read: false },
  { notificationId: "ntf-2", level: "WARNING", message: "B101 공실인데 288W 전력 소비 중입니다", createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(), read: false },
  { notificationId: "ntf-3", level: "INFO", message: "B103 조명이 절전 추천 스케줄에 따라 자동으로 꺼졌습니다", createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(), read: true },
  { notificationId: "ntf-4", level: "CRITICAL", message: "NODE-B101-01 노드가 오류 상태입니다", createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(), read: true },
];

// --- 사용자 관리 (A-08, A-09) 인메모리 목 데이터 ---
let USERS = [
  { userId: "u-1", loginId: "demo", name: "양지우", email: "demo@enersave.io", role: "ADMIN", status: "ACTIVE", requestedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { userId: "u-2", loginId: "parkfacility", name: "박시설", email: "park@enersave.io", role: "MEMBER", status: "ACTIVE", requestedAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  { userId: "u-3", loginId: "leenew", name: "이신규", email: "lee@enersave.io", role: "MEMBER", status: "PENDING", requestedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { userId: "u-4", loginId: "choiintern", name: "최인턴", email: "choi@enersave.io", role: "MEMBER", status: "PENDING", requestedAt: new Date(Date.now() - 6 * 3600000).toISOString() },
];

function bucketStart(period, index, count) {
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - (count - 1 - index) * 7);
    return d;
  }
  if (period === "month") {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return d;
  }
  const d = new Date(now);
  d.setDate(d.getDate() - (count - 1 - index));
  return d;
}

function generateReport(period, spaceId) {
  const count = REPORT_BUCKETS[period] || REPORT_BUCKETS.day;
  const rand = hashSeed(`report-${period}-${spaceId || "all"}`);

  const totalRated = SPACES.reduce((sum, s) => sum + s.ratedPowerW, 0);
  const ratedBase = spaceId ? SPACES.find((s) => s.spaceId === spaceId)?.ratedPowerW ?? 0 : totalRated;

  const dutyFactor = 0.35;
  const bucketHours = period === "day" ? 24 : period === "week" ? 24 * 7 : 24 * 30;
  const baselineWhPerBucket = ratedBase * dutyFactor * bucketHours;

  const items = [];
  for (let i = 0; i < count; i++) {
    const savingRatio = 0.12 + rand() * 0.18;
    const baselineJitter = 0.95 + rand() * 0.1;
    const baselineWh = baselineWhPerBucket * baselineJitter;
    const usageWh = baselineWh * (1 - savingRatio);
    items.push({
      date: bucketStart(period, i, count).toISOString(),
      usageWh: Math.round(usageWh),
      baselineWh: Math.round(baselineWh),
    });
  }

  const totalUsageWh = items.reduce((s, it) => s + it.usageWh, 0);
  const totalBaselineWh = items.reduce((s, it) => s + it.baselineWh, 0);
  const totalSavingWh = totalBaselineWh - totalUsageWh;
  const savingRate = totalBaselineWh > 0 ? totalSavingWh / totalBaselineWh : 0;
  const savingCost = Math.round((totalSavingWh / 1000) * PRICE_PER_KWH);
  const co2ReductionKg = Math.round((totalSavingWh / 1000) * CO2_FACTOR_KG_PER_KWH * 10) / 10;

  return {
    summary: { totalSavingWh, savingCost, co2ReductionKg, savingRate },
    items,
  };
}

// --- 8단계: 공간 상세 · 그래프용 이력 생성 ---
const INTERVAL_MINUTES = { "1m": 1, "10m": 10, "1h": 60 };

function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// 같은 (spaceId, hours, interval) 조합이면 재실 구간은 항상 동일하게 나오도록 시드 고정
// (그래프가 폴링될 때마다 음영 위치가 흔들리지 않게 하기 위함)
function generateHistory(spaceId, hours, interval) {
  const intervalMinutes = INTERVAL_MINUTES[interval] || 1;
  const totalPoints = Math.max(1, Math.round((hours * 60) / intervalMinutes));
  const now = Date.now();
  const rangeMs = hours * 3600000;
  const rangeStart = now - rangeMs;

  const rand = hashSeed(`${spaceId}-${hours}-${interval}`);
  const periodCount = 2 + Math.floor(rand() * 2); // 2~3개 재실 구간
  const occupiedPeriods = [];
  for (let i = 0; i < periodCount; i++) {
    const start = rangeStart + rand() * rangeMs * 0.75;
    const durationMs = rangeMs * (0.06 + rand() * 0.14);
    occupiedPeriods.push({
      start: new Date(start).toISOString(),
      end: new Date(start + durationMs).toISOString(),
    });
  }
  occupiedPeriods.sort((a, b) => new Date(a.start) - new Date(b.start));

  const space = SPACES.find((s) => s.spaceId === spaceId);
  const baseActive = space ? space.ratedPowerW * 0.5 : 300;
  const baseIdle = space ? space.ratedPowerW * 0.05 : 15;
  const tailWindowMs = rangeMs * 0.05; // 재실 종료 후 "끄는 걸 잊은" 낭비 구간

  const points = [];
  for (let j = 0; j < totalPoints; j++) {
    const t = rangeStart + j * intervalMinutes * 60000;
    const occupied = occupiedPeriods.some(
      (p) => t >= new Date(p.start).getTime() && t <= new Date(p.end).getTime()
    );

    let wasteTail = false;
    if (!occupied) {
      const lastEnd = occupiedPeriods
        .map((p) => new Date(p.end).getTime())
        .filter((end) => end <= t)
        .sort((a, b) => b - a)[0];
      if (lastEnd !== undefined && t - lastEnd < tailWindowMs) wasteTail = true;
    }

    let powerW;
    if (occupied) {
      powerW = baseActive + (Math.random() - 0.5) * baseActive * 0.3;
    } else if (wasteTail) {
      powerW = baseActive * 0.65 + (Math.random() - 0.5) * baseActive * 0.15;
    } else {
      powerW = baseIdle + Math.random() * baseIdle * 0.6;
    }

    // 약 1.5% 확률로 데이터 결측 (통신 끊김 시뮬레이션)
    const missing = Math.random() < 0.015;

    points.push({
      t: new Date(t).toISOString(),
      powerW: missing ? null : Math.max(0, Math.round(powerW)),
    });
  }

  return { points, occupiedPeriods };
}

export const handlers = [
  // A-01 로그인
  http.post("/auth/login", async ({ request }) => {
    const { loginId, password } = await request.json();
    if (loginId === "pending") {
      return fail(403, "E4030", "승인 대기 중인 계정입니다. 관리자에게 문의하세요");
    }
    if (loginId !== "demo" || password !== "demo1234") {
      return fail(401, "E4010", "아이디 또는 비밀번호가 올바르지 않습니다");
    }
    accessSeq += 1;
    return ok({
      accessToken: `mock-access-${accessSeq}`,
      refreshToken: "mock-refresh-token",
      user: { id: "u-1", loginId: "demo", name: "양지우", email: "demo@enersave.io", role: "ADMIN" },
    });
  }),

  // A-02 토큰 갱신
  http.post("/auth/refresh", async () => {
    accessSeq += 1;
    return ok({ accessToken: `mock-access-${accessSeq}`, refreshToken: "mock-refresh-token" });
  }),

  // A-04 내 정보
  http.get("/auth/me", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) return fail(401, "E4010", "인증이 필요합니다");
    return ok({ id: "u-1", loginId: "demo", name: "양지우", email: "demo@enersave.io", role: "ADMIN" });
  }),

  // A-06 아이디 중복 확인
  http.get("/auth/check-id", ({ request }) => {
    const url = new URL(request.url);
    const loginId = url.searchParams.get("loginId");
    return ok({ available: loginId !== "demo" });
  }),

  // 비밀번호 변경 (설정 화면용, 문서 명세 외 추가)
  http.patch("/auth/password", async ({ request }) => {
    const body = await request.json();
    if (!body.currentPassword || body.currentPassword !== "demo1234") {
      return fail(401, "E4010", "현재 비밀번호가 올바르지 않습니다");
    }
    if (!body.newPassword || body.newPassword.length < 8) {
      return fail(400, "E4000", "새 비밀번호는 8자 이상이어야 합니다");
    }
    return ok(null);
  }),

  // A-05 회원가입
  http.post("/auth/signup", async () => {
    return ok({ id: "u-new", role: "PENDING" });
  }),

  // E-03 실시간 전력
  http.get("/monitoring/realtime-power", () => {
    const totalW = ROOMS.reduce((sum, r) => sum + mockPower(r.base), 0);
    const wasteW = ROOMS.filter((r) => !r.occupied && r.base > 0).reduce(
      (sum, r) => sum + mockPower(r.base),
      0
    );
    return ok({ totalW, wasteW });
  }),

  // E-01 재실 맵
  http.get("/monitoring/occupancy-map", () => {
    const spaces = ROOMS.map((r) => {
      const powerW = mockPower(r.base);
      return {
        spaceId: r.spaceId,
        code: r.code,
        name: r.name,
        floor: r.floor,
        occupied: r.occupied,
        powerW,
        wasteFlag: !r.occupied && powerW > 50,
      };
    });
    return ok({ spaces });
  }),

  // E-04 절감량
  http.get("/monitoring/savings", () => {
    return ok({ todaySavingWh: 4300, savingRate: 0.18 });
  }),

  // B-02 공간 목록 (건물/층 필터)
  http.get("/spaces", ({ request }) => {
    const url = new URL(request.url);
    const building = url.searchParams.get("building");
    const floor = url.searchParams.get("floor");
    let items = SPACES;
    if (building) items = items.filter((s) => s.building === building);
    if (floor) items = items.filter((s) => String(s.floor) === floor);
    return ok({ items });
  }),

  // B-03 공간 상세
  http.get("/spaces/:spaceId", ({ params }) => {
    const space = SPACES.find((s) => s.spaceId === params.spaceId);
    if (!space) return fail(404, "E4040", "공간을 찾을 수 없습니다");
    return ok(space);
  }),

  // B-01 공간 등록
  http.post("/spaces", async ({ request }) => {
    const body = await request.json();
    spaceSeq += 1;
    const space = {
      spaceId: `sp-${spaceSeq}`,
      nodeCount: 0,
      status: "정상",
      ...body,
    };
    SPACES = [...SPACES, space];
    return ok(space);
  }),

  // B-04 공간 수정
  http.patch("/spaces/:spaceId", async ({ params, request }) => {
    const body = await request.json();
    let updated = null;
    SPACES = SPACES.map((s) => {
      if (s.spaceId !== params.spaceId) return s;
      updated = { ...s, ...body };
      return updated;
    });
    if (!updated) return fail(404, "E4040", "공간을 찾을 수 없습니다");
    return ok(updated);
  }),

  // B-05 공간 삭제 - 연결된 노드가 있으면 409
  http.delete("/spaces/:spaceId", ({ params }) => {
    const space = SPACES.find((s) => s.spaceId === params.spaceId);
    if (!space) return fail(404, "E4040", "공간을 찾을 수 없습니다");
    if (space.nodeCount > 0) {
      return fail(409, "E4090", "연결된 센서 노드를 먼저 해제하세요");
    }
    SPACES = SPACES.filter((s) => s.spaceId !== params.spaceId);
    return ok(null);
  }),

  // --- 디바이스 관리 (C-01~C-03) ---
  http.get("/devices", () => {
    const items = DEVICES.map((d) => ({
      ...d,
      lastSeenAt:
        d.status === "ONLINE"
          ? new Date(Date.now() - Math.random() * 15000).toISOString()
          : d.lastSeenAt,
    }));
    return ok({ items });
  }),

  http.get("/devices/:deviceId", ({ params }) => {
    const device = DEVICES.find((d) => d.deviceId === params.deviceId);
    if (!device) return fail(404, "E4040", "노드를 찾을 수 없습니다");
    return ok(device);
  }),

  http.post("/devices", async ({ request }) => {
    const body = await request.json();
    deviceSeq += 1;
    const apiKey = `dvk_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const device = {
      deviceId: body.deviceId,
      spaceId: body.spaceId,
      sensors: body.sensors ?? [],
      actuators: body.actuators ?? [],
      status: "OFFLINE",
      signalStrength: 0,
      firmware: "v1.0.0",
      lastSeenAt: new Date().toISOString(),
    };
    DEVICES = [...DEVICES, device];
    const space = SPACES.find((s) => s.spaceId === body.spaceId);
    if (space) space.nodeCount += 1;
    // deviceApiKey는 이 응답에만 포함되고 이후 목록/상세 조회에는 절대 내려오지 않는다
    return ok({ ...device, deviceApiKey: apiKey });
  }),

  // --- 8단계: 공간 상세 · 그래프 (D-02, E-02) ---
  http.get("/telemetry/power-history/:spaceId", ({ params, request }) => {
    const url = new URL(request.url);
    const hours = Number(url.searchParams.get("hours")) || 1;
    const interval = url.searchParams.get("interval") || "1m";
    const { points, occupiedPeriods } = generateHistory(params.spaceId, hours, interval);
    return ok({ points, occupiedPeriods });
  }),

  http.get("/monitoring/occupancy-history/:spaceId", ({ params, request }) => {
    const url = new URL(request.url);
    const hours = Number(url.searchParams.get("hours")) || 1;
    const interval = url.searchParams.get("interval") || "1m";
    const { occupiedPeriods } = generateHistory(params.spaceId, hours, interval);
    return ok({ periods: occupiedPeriods });
  }),

  // --- 9단계: 제어 패널 · 이력 (G-01, G-04) ---
  http.post("/control/commands", async ({ request }) => {
    const body = await request.json();
    const spaceDevices = DEVICES.filter((d) => d.spaceId === body.spaceId);
    const hasOnlineNode = spaceDevices.some((d) => d.status === "ONLINE");
    if (!hasOnlineNode) {
      return fail(503, "E5030", "센서 노드가 오프라인입니다");
    }

    commandSeq += 1;
    const commandId = `cmd-${commandSeq}`;
    const command = {
      commandId,
      spaceId: body.spaceId,
      action: body.action,
      value: body.value,
      trigger: "MANUAL",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    COMMANDS.push(command);

    // 노드가 최대 5초 뒤 폴링해서 명령을 가져가고 실행한다는 설정을 재현.
    // 약 12% 확률로는 끝까지 응답이 오지 않아 "응답 없음" UI 분기를 테스트할 수 있게 한다.
    const willRespond = Math.random() > 0.12;
    if (willRespond) {
      setTimeout(() => {
        command.status = "COMPLETED";
        command.completedAt = new Date().toISOString();
        logSeq += 1;
        CONTROL_LOGS = [
          {
            logId: `log-${logSeq}`,
            timestamp: command.completedAt,
            spaceId: command.spaceId,
            action: command.action,
            value: command.value,
            trigger: command.trigger,
            result: "COMPLETED",
          },
          ...CONTROL_LOGS,
        ];
      }, 2500 + Math.random() * 3000);
    }

    // 202 Accepted + PENDING: "접수했다"이지 "실행했다"가 아니다
    return accepted({ commandId, status: "PENDING" });
  }),

  http.get("/control/commands/:commandId", ({ params }) => {
    const command = COMMANDS.find((c) => c.commandId === params.commandId);
    if (!command) return fail(404, "E4040", "명령을 찾을 수 없습니다");
    return ok(command);
  }),

  http.get("/control/logs", () => {
    return ok({ items: CONTROL_LOGS });
  }),

  // --- 10단계: 절전 추천 (F-01, F-02) ---
  http.get("/recommendations", () => {
    return ok({ items: RECOMMENDATIONS });
  }),

  http.post("/recommendations/:id/apply", ({ params }) => {
    const rec = RECOMMENDATIONS.find((r) => r.recommendationId === params.id);
    if (!rec) return fail(404, "E4040", "추천을 찾을 수 없습니다");
    scheduleSeq += 1;
    rec.status = "APPLIED";
    rec.scheduleId = `sch-${scheduleSeq}`;
    return ok(rec);
  }),

  http.post("/recommendations/:id/reject", async ({ params, request }) => {
    const body = await request.json();
    const rec = RECOMMENDATIONS.find((r) => r.recommendationId === params.id);
    if (!rec) return fail(404, "E4040", "추천을 찾을 수 없습니다");
    rec.status = "REJECTED";
    rec.comment = body.comment || null;
    return ok(rec);
  }),

  // --- 11단계: 리포트 (H-01) ---
  http.get("/reports/savings", ({ request }) => {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "day";
    const spaceId = url.searchParams.get("spaceId") || null;
    return ok(generateReport(period, spaceId));
  }),

  // --- 12단계: 알림 (H-02) ---
  http.get("/notifications", () => {
    const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;
    return ok({ items: NOTIFICATIONS, unreadCount });
  }),

  // --- 12단계: 사용자 관리 (A-08, A-09) ---
  http.get("/users", () => {
    return ok({ items: USERS });
  }),

  http.patch("/users/:userId", async ({ params, request }) => {
    const body = await request.json();
    let updated = null;
    USERS = USERS.map((u) => {
      if (u.userId !== params.userId) return u;
      updated = { ...u, ...body };
      return updated;
    });
    if (!updated) return fail(404, "E4040", "사용자를 찾을 수 없습니다");
    return ok(updated);
  }),
];
