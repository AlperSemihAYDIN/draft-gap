// Ziyaretçi istatistikleri — localStorage tabanlı basit analytics
// Harici servis gerektirmez, GDPR uyumlu (kişisel veri saklamaz)

const STORAGE_KEY = 'draftgap_analytics';

function getAnalytics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveAnalytics(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage dolu veya erişilemez
  }
}

function getToday() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Sayfa ziyaretini kaydet.
 * Dönüş: { todayViews, totalViews, uniqueDays, firstVisit }
 */
export function trackVisit() {
  const today = getToday();
  let data = getAnalytics();

  if (!data) {
    data = {
      firstVisit: today,
      totalViews: 0,
      days: {},
    };
  }

  data.totalViews = (data.totalViews || 0) + 1;

  if (!data.days) data.days = {};
  data.days[today] = (data.days[today] || 0) + 1;

  // Son 30 günden eski verileri temizle (localStorage tasarrufu)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  for (const day of Object.keys(data.days)) {
    if (day < cutoffStr) delete data.days[day];
  }

  saveAnalytics(data);

  return {
    todayViews: data.days[today] || 0,
    totalViews: data.totalViews,
    uniqueDays: Object.keys(data.days).length,
    firstVisit: data.firstVisit,
  };
}

/**
 * Mevcut istatistikleri oku (kaydetmeden)
 */
export function getStats() {
  const data = getAnalytics();
  if (!data) {
    return { todayViews: 0, totalViews: 0, uniqueDays: 0, firstVisit: null };
  }
  const today = getToday();
  return {
    todayViews: data.days?.[today] || 0,
    totalViews: data.totalViews || 0,
    uniqueDays: Object.keys(data.days || {}).length,
    firstVisit: data.firstVisit,
  };
}
