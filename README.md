# ENERSAVE Frontend

스마트 에너지 절약 시스템 프론트엔드. 시안 A(Clarity)를 기준으로 0단계(세팅)~2단계(로그인)까지 구현되어 있습니다.

## 실행

```bash
npm install
npm run dev
```

`.env`의 `VITE_USE_MOCKS=true` 상태에서는 MSW가 백엔드 없이 동작합니다.
데모 로그인 계정: `demo` / `demo1234`

백엔드가 준비되면:
1. `.env`의 `VITE_API_BASE_URL`을 실제 서버 주소로 설정
2. `VITE_USE_MOCKS=false`로 변경

## 구조

- `src/api/` — 엔드포인트별 API 함수 (client.js가 토큰 주입/401 재시도/응답 언랩 공통 처리)
- `src/context/AuthContext.jsx` — accessToken은 메모리, refreshToken은 localStorage
- `src/components/layout/` — Sidebar, Header, AppLayout, ProtectedRoute
- `src/components/common/` — StatCard, Badge, Button
- `src/pages/` — 화면 단위 (Dashboard, Login, Signup은 구현 완료 / 나머지는 자리표시자)
- `src/mocks/` — MSW 핸들러
- `src/styles/tokens.css` — Clarity 디자인 토큰

## 구현 완료

- [x] 0단계 세팅 (API 클라이언트, MSW, 폴더 구조)
- [x] 1단계 공통 레이아웃 · 라우팅
- [x] 2단계 로그인
- [x] 3단계 회원가입
- [x] 4단계 인증 가드
- [x] 7단계 대시보드 메인 (E-01, E-03 5초 폴링 / E-04 30초 폴링, 낭비 강조)
- [x] 5단계 공간 관리 (B-01~B-05, 건물/층 필터, 모달 등록·수정, 삭제 409 처리)
- [x] 6단계 디바이스 관리 (C-01~C-02, deviceApiKey 1회성 노출 모달, 상태 배지, 상대시간, 10초 폴링)
- [x] UI 폴리싱 (lucide-react 아이콘 전면 적용, 로그인 데모계정 문구 제거, 카드/테이블/버튼 디테일 정리)
- [x] 8단계 공간 상세 · 그래프 (B-03, D-02, E-02 / 기간 탭 1h·6h·24h·7d / Recharts ReferenceArea로 재실 구간 음영 / connectNulls=false로 결측 구간 끊어 표시)
- [x] 9단계 제어 패널 · 이력 (G-01, G-04 / 202 Accepted → 폴링(2초 간격, 15초 타임아웃) → 완료·응답없음 UI 분기 / 503 E5030 오프라인 안내 / AUTO·MANUAL 배지)
- [x] 10단계 절전 추천 (F-01, F-02 / 대기중·적용됨·반려됨 탭 / reason 강조 카드 / 신뢰도 게이지 / 적용 확인 모달 / 반려 사유 입력)
- [x] 11단계 리포트 (H-01 / 일·주·월 탭 + 공간 필터 / ComposedChart로 사용량 vs 기준선 비교 / 총 절감량·절감금액·CO₂ 감축량 + 환산계수 각주 / 날짜별 상세 표)
- [x] 12단계 알림 · 사용자 관리 (H-02 헤더 벨 드롭다운 30초 폴링 + level별 아이콘 색 / A-08,09 승인·거절·권한변경, ADMIN 전용 라우트)
- [x] 설정 페이지 (계정 정보, 비밀번호 변경, 알림 환경설정 UI 데모 — 문서 13단계 목록에는 없던 화면이라 최소 구성으로 채움)
- [x] 모바일 반응형 수정 (사이드바 드로어 전환, 표 가로 스크롤, 버튼 텍스트 줄바꿈 방지)
- [ ] 13단계 (선택) 실시간 스트림 전환 — 백엔드 WebSocket 준비 후 진행 권장, 미구현
