const ID = "bb_sid",
  LAST = "bb_visit_last",
  DISABLED = "bb_analytics_disabled";
export function setAnalyticsExcluded(excluded: boolean) {
  try {
    sessionStorage.setItem(DISABLED, String(excluded));
  } catch {
    /* storage unavailable */
  }
}
export function getAnalyticsSessionId(): string | undefined {
  try {
    if (
      typeof window === "undefined" ||
      sessionStorage.getItem(DISABLED) === "true"
    )
      return undefined;
    const now = Date.now();
    const last = Number(sessionStorage.getItem(LAST));
    let id = sessionStorage.getItem(ID);
    if (!id || !last || now - last >= 30 * 60 * 1000) {
      id = crypto.randomUUID();
      sessionStorage.setItem(ID, id);
    }
    sessionStorage.setItem(LAST, String(now));
    return id;
  } catch {
    return undefined;
  }
}
export function campaignParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get("utm_source") || undefined,
      medium: params.get("utm_medium") || undefined,
      campaign: params.get("utm_campaign") || undefined,
    };
  } catch {
    return {};
  }
}
