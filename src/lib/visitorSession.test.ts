import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { getAnalyticsSessionId, setAnalyticsExcluded } from "./visitorSession";
beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-17T19:00:00Z"));
});
afterEach(() => vi.useRealTimers());
it("keeps one session for activity then rotates after 30 idle minutes", () => {
  const first = getAnalyticsSessionId();
  expect(first).toBeTruthy();
  vi.advanceTimersByTime(29 * 60000);
  expect(getAnalyticsSessionId()).toBe(first);
  vi.advanceTimersByTime(30 * 60000);
  expect(getAnalyticsSessionId()).not.toBe(first);
});
it("does not create analytics sessions while admin/auth loading is excluded", () => {
  setAnalyticsExcluded(true);
  expect(getAnalyticsSessionId()).toBeUndefined();
  expect(sessionStorage.getItem("bb_sid")).toBeNull();
  setAnalyticsExcluded(false);
  expect(getAnalyticsSessionId()).toBeTruthy();
});
