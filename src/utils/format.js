// W 또는 Wh 값을 사람이 읽기 좋은 단위로 변환한다.
// 1000 이상이면 k 단위로 자동 전환 (가이드 7단계 구현 포인트)
export function formatPower(watts) {
  if (watts >= 1000) {
    return { value: (watts / 1000).toFixed(1), unit: "kW" };
  }
  return { value: Math.round(watts).toString(), unit: "W" };
}

export function formatEnergy(wh) {
  if (wh >= 1000) {
    return { value: (wh / 1000).toFixed(1), unit: "kWh" };
  }
  return { value: Math.round(wh).toString(), unit: "Wh" };
}

export function formatCurrency(won) {
  return `${Math.round(won).toLocaleString("ko-KR")}원`;
}

export function formatPercent(ratio) {
  return Math.round(ratio * 100);
}

// "12초 전", "3분 전"처럼 상대 시간으로 표시 (6단계 lastSeenAt)
export function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  return `${day}일 전`;
}
