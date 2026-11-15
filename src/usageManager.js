/**
 * LocalStorage 기반 일일 무료 분석 횟수 관리 & 바이럴 충전 로직
 */

const STORAGE_KEY = 'katalk_love_test_usage_v1';
const DAILY_FREE_LIMIT = 3;

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getUsageData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = getTodayString();
    if (!raw) {
      return { date: today, used: 0, bonus: 0 };
    }
    const data = JSON.parse(raw);
    if (data.date !== today) {
      // 날짜가 바뀌면 초기화
      const resetData = { date: today, used: 0, bonus: 0 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
      return resetData;
    }
    return {
      date: today,
      used: Number(data.used) || 0,
      bonus: Number(data.bonus) || 0,
    };
  } catch (e) {
    return { date: getTodayString(), used: 0, bonus: 0 };
  }
}

export function getRemainingCount() {
  const { used, bonus } = getUsageData();
  const totalAllowed = DAILY_FREE_LIMIT + bonus;
  return Math.max(0, totalAllowed - used);
}

export function getTotalAllowedCount() {
  const { bonus } = getUsageData();
  return DAILY_FREE_LIMIT + bonus;
}

export function consumeAnalysisCount() {
  const data = getUsageData();
  const updated = {
    ...data,
    used: data.used + 1,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return getRemainingCount();
}

/**
 * 공유 또는 링크 복사 시 보너스 2회 즉시 충전
 */
export function addBonusCount(amount = 2) {
  const data = getUsageData();
  const updated = {
    ...data,
    bonus: (data.bonus || 0) + amount,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return getRemainingCount();
}

