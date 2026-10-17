import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminVisitors from "./AdminVisitors";
import { adminApi } from "@/lib/api";
vi.mock("@/lib/api", () => ({
  adminApi: { getVisitorStats: vi.fn(), getVisitorJourney: vi.fn() },
}));
const data = {
  overview: {
    totalVisitors: 10,
    uniqueIPs: 8,
    pageViews: 30,
    cartSessions: 4,
    convertedSessions: 1,
  },
  today: { visitors: 2, uniqueIPs: 2 },
  comparison: {
    previous: { sessions: 5, views: 10 },
    sessionsChange: 100,
    viewsChange: 200,
  },
  trafficSources: [{ source: "Google", channel: "Search", count: 8 }],
  topProducts: [{ name: "Ignition Coil", slug: "coil", views: 5, sessions: 3 }],
  funnel: { sessions: 10, product: 7, cart: 4, checkout: 2, orders: 1 },
  excludedBots: 3,
  notes: "Measured sessions",
  topPages: [],
  devices: [],
  browsers: [],
  topCountries: [],
  topCities: [],
  dailyVisits: [
    { date: "2026-10-17", visitors: 0, uniqueIPs: 0 },
    { date: "2026-10-18", visitors: 10, uniqueIPs: 8 },
  ],
  recentVisitors: [
    {
      id: "session",
      ip: "127.0.0.1",
      page: "/",
      device: "mobile",
      browser: "Chrome",
      os: "Android",
      city: "Pune",
      country: "India",
      createdAt: "2026-10-17T19:00:00Z",
      lastSeenAt: "2026-10-17T19:30:00Z",
      pageViewCount: 6,
      traffic: { source: "Google", channel: "Search" },
    },
  ],
  visitorsPagination: {
    page: 1,
    totalPages: 2,
    total: 21,
    hasPrev: false,
    hasNext: true,
  },
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminApi.getVisitorStats).mockResolvedValue({
    success: true,
    data,
  } as never);
  vi.mocked(adminApi.getVisitorJourney).mockResolvedValue({
    success: true,
    data: {
      items: Array.from({ length: 6 }, (_, i) => ({
        id: String(i),
        page: "/products/step-" + i,
        createdAt: "2026-10-17T19:00:00Z",
      })),
      hasNext: false,
    },
  } as never);
});
afterEach(cleanup);
it("shows sources, product links, truthful metrics and full journeys", async () => {
  render(
    <MemoryRouter>
      <AdminVisitors />
    </MemoryRouter>,
  );
  await screen.findByText("Shopping funnel");
  expect(screen.getByText(/8 unique IPs/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ignition Coil" })).toHaveAttribute(
    "href",
    "/products/coil",
  );
  expect(
    screen.getByRole("button", {
      name: "2026-10-18: 10 sessions, 8 unique IPs",
    }),
  ).toHaveStyle({ height: "100%" });
  fireEvent.click(
    screen.getByRole("button", { name: "View journey for 127.0.0.1" }),
  );
  await screen.findByText("step 5");
  expect(adminApi.getVisitorJourney).toHaveBeenCalledWith("session", 1);
  fireEvent.click(screen.getByLabelText("Include likely bots"));
  await waitFor(() =>
    expect(adminApi.getVisitorStats).toHaveBeenLastCalledWith(30, 1, 20, true),
  );
  fireEvent.click(screen.getByRole("button", { name: "7 days" }));
  await waitFor(() =>
    expect(adminApi.getVisitorStats).toHaveBeenLastCalledWith(7, 1, 20, true),
  );
});
it("provides retry on API failure", async () => {
  vi.mocked(adminApi.getVisitorStats).mockRejectedValueOnce(
    new Error("offline"),
  );
  render(
    <MemoryRouter>
      <AdminVisitors />
    </MemoryRouter>,
  );
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByText("Shopping funnel");
});
it("ignores an older response after changing the period", async () => {
  let resolveOld: (value: unknown) => void = () => {};
  vi.mocked(adminApi.getVisitorStats).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve as typeof resolveOld;
      }),
  );
  vi.mocked(adminApi.getVisitorStats).mockResolvedValue({
    success: true,
    data: {
      ...data,
      trafficSources: [
        { source: "New period source", channel: "Referral", count: 1 },
      ],
    },
  } as never);
  render(
    <MemoryRouter>
      <AdminVisitors />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "7 days" }));
  await screen.findByText("New period source");
  resolveOld({
    success: true,
    data: {
      ...data,
      trafficSources: [
        { source: "Old period source", channel: "Referral", count: 1 },
      ],
    },
  });
  await waitFor(() =>
    expect(screen.queryByText("Old period source")).not.toBeInTheDocument(),
  );
  expect(screen.getByText("New period source")).toBeInTheDocument();
});
