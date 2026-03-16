const kstFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function getTodayDateString() {
  return kstFormatter.format(new Date());
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatDistanceKm(distanceM: number) {
  return `${(distanceM / 1000).toFixed(distanceM % 1000 === 0 ? 0 : 1)}km`;
}

export function formatDistanceNumber(distanceM: number) {
  return (distanceM / 1000).toFixed(distanceM % 1000 === 0 ? 0 : 1);
}

export function parseDistanceKm(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("거리는 0보다 큰 km 단위 숫자로 입력해주세요.");
  }

  return Math.round(parsed * 1000);
}

export function parsePaceToSeconds(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{1,2}:\d{2}$/.test(value)) {
    throw new Error("평균 페이스는 mm:ss 형식으로 입력해주세요.");
  }

  const [minutes, seconds] = value.split(":").map(Number);
  if (seconds >= 60) {
    throw new Error("평균 페이스의 초는 00부터 59까지만 가능합니다.");
  }

  return minutes * 60 + seconds;
}

export function formatPace(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDelta(distanceM: number) {
  const prefix = distanceM >= 0 ? "+" : "-";
  return `${prefix}${formatDistanceNumber(Math.abs(distanceM))}km`;
}

export function isSameKstDate(isoString: string, compareDate: string) {
  return kstFormatter.format(new Date(isoString)) === compareDate;
}

export function isEditableToday(isoString: string) {
  return isSameKstDate(isoString, getTodayDateString());
}
