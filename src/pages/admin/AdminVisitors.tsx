import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  RefreshCw,
  Users,
  Eye,
  ShoppingCart,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { adminApi } from "@/lib/api";

interface PageView {
  id?: string;
  page: string;
  createdAt: string;
}
interface Session {
  id: string;
  ip: string;
  page: string;
  device: string;
  browser: string;
  os: string;
  city: string | null;
  country: string | null;
  createdAt: string;
  lastSeenAt: string;
  pageViewCount: number;
  isBot: boolean;
  traffic: { source: string; channel: string };
  campaign: string | null;
}
interface Stats {
  overview: {
    totalVisitors: number;
    uniqueIPs: number;
    pageViews: number;
    cartSessions: number;
    convertedSessions: number;
  };
  today: { visitors: number; uniqueIPs: number };
  comparison: {
    previous: { sessions: number; views: number };
    sessionsChange: number | null;
    viewsChange: number | null;
  };
  trafficSources: {
    channel: string;
    source: string;
    medium: string | null;
    campaign: string | null;
    count: number;
  }[];
  topProducts: {
    slug: string;
    name: string;
    views: number;
    sessions: number;
  }[];
  funnel: {
    sessions: number;
    product: number;
    cart: number;
    checkout: number;
    orders: number;
  };
  excludedBots: number;
  notes: string;
  topPages: { page: string; count: number }[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topCities: { city: string; country: string; count: number }[];
  recentVisitors: Session[];
  dailyVisits: { date: string; visitors: number; uniqueIPs: number }[];
  visitorsPagination: {
    page: number;
    totalPages: number;
    total: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
}
const number = (v: number) => v.toLocaleString("en-IN");
const time = (date: string) =>
  new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
function pageLabel(path: string) {
  if (path === "/") return "Home";
  try {
    return decodeURIComponent(path)
      .replace(/^\/products\//, "")
      .replace(/-/g, " ");
  } catch {
    return path;
  }
}
function change(value: number | null) {
  return value === null
    ? "No previous activity to compare"
    : `${value > 0 ? "+" : ""}${value}% vs previous period`;
}
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-xl p-5 min-w-0">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}
function Breakdown({ rows }: { rows: { label: string; count: number }[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  return rows.length ? (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i}>
          <div className="flex justify-between gap-3 text-sm mb-1">
            <span className="truncate">{row.label}</span>
            <span className="text-muted-foreground shrink-0">
              {number(row.count)}
            </span>
          </div>
          <div className="h-1.5 rounded bg-secondary">
            <div
              className="h-full bg-primary/70 rounded"
              style={{ width: `${total ? (row.count / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">No activity in this period.</p>
  );
}
function Journey({ id }: { id: string }) {
  const [items, setItems] = useState<PageView[]>([]),
    [page, setPage] = useState(0),
    [more, setMore] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const load = useCallback(async (next: number) => {
    setBusy(true);
    setError(false);
    try {
      const res = await adminApi.getVisitorJourney(id, next);
      const data = res.data as { items: PageView[]; hasNext: boolean };
      setItems((current) =>
        next === 1 ? data.items : [...current, ...data.items],
      );
      setPage(next);
      setMore(data.hasNext);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }, [id]);
  useEffect(() => {
    void load(1);
  }, [load]);
  return (
    <div className="px-5 py-4 bg-secondary/30">
      <p className="font-medium text-sm mb-3">Full page journey · India time</p>
      <ol className="space-y-2">
        {items.map((p, i) => (
          <li
            key={p.id || `${p.createdAt}-${i}`}
            className="flex gap-3 text-sm"
          >
            <span className="text-primary">{i + 1}.</span>
            <span className="break-all flex-1">{pageLabel(p.page)}</span>
            <time className="text-muted-foreground shrink-0">
              {time(p.createdAt)}
            </time>
          </li>
        ))}
      </ol>
      {error && (
        <p className="text-destructive text-sm mt-3">
          Could not load the journey. Try again.
        </p>
      )}
      {(more || error) && (
        <button
          disabled={busy}
          onClick={() => void load(page + 1)}
          className="text-primary text-sm mt-3 disabled:opacity-50"
        >
          {busy ? "Loading…" : error ? "Retry journey" : "Load more pages"}
        </button>
      )}
      {!busy && !items.length && !error && (
        <p className="text-muted-foreground text-sm">No page views recorded.</p>
      )}
    </div>
  );
}
export default function AdminVisitors() {
  const [stats, setStats] = useState<Stats | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false);
  const [days, setDays] = useState(30),
    [page, setPage] = useState(1),
    [includeBots, setIncludeBots] = useState(false),
    [reload, setReload] = useState(0),
    [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    adminApi
      .getVisitorStats(days, page, 20, includeBots)
      .then((res) => {
        if (active) setStats(res.data as Stats);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [days, page, includeBots, reload]);
  const max = Math.max(1, ...(stats?.dailyVisits.map((d) => d.visitors) || []));
  const steps = stats
    ? [
        { label: "Sessions", value: stats.funnel.sessions },
        { label: "Viewed product", value: stats.funnel.product },
        { label: "Added to cart", value: stats.funnel.cart },
        { label: "Reached checkout", value: stats.funnel.checkout },
        { label: "Placed order", value: stats.funnel.orders },
      ]
    : [];
  return (
    <div className="space-y-6" aria-busy={loading}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-oswald text-2xl font-bold uppercase">
            Visitor <span className="text-primary">Analytics</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Understand traffic, product interest and shopping progress.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 border border-border rounded-lg px-3 py-2 text-sm disabled:opacity-50"
          onClick={() => setReload((r) => r + 1)}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              aria-pressed={days === d}
              onClick={() => {
                setDays(d);
                setPage(1);
                setExpanded(null);
              }}
              className={`px-3 py-2 text-sm rounded-lg border ${days === d ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
            >
              {d} days
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeBots}
            onChange={(e) => {
              setIncludeBots(e.target.checked);
              setPage(1);
            }}
          />
          Include likely bots
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        All dates use India time (IST). Today is a partial day; comparisons use
        the same elapsed time.
      </p>
      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading visitor analytics…
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="border border-destructive/40 rounded-lg p-4"
        >
          Could not load analytics.{" "}
          <button
            onClick={() => setReload((r) => r + 1)}
            className="text-primary underline"
          >
            Try again
          </button>
        </div>
      )}
      {stats && !error && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                label: "Sessions started",
                value: stats.overview.totalVisitors,
                icon: Users,
                sub: change(stats.comparison.sessionsChange),
              },
              {
                label: "Page views",
                value: stats.overview.pageViews,
                icon: Eye,
                sub: change(stats.comparison.viewsChange),
              },
              {
                label: "Sessions with cart adds",
                value: stats.overview.cartSessions,
                icon: ShoppingCart,
                sub: "Successful add-to-cart actions",
              },
              {
                label: "Sessions with orders",
                value: stats.overview.convertedSessions,
                icon: ShoppingBag,
                sub: "Paid online or COD; excludes cancelled/returned",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-card border border-border rounded-xl p-5"
              >
                <card.icon size={19} className="text-primary mb-3" />
                <p className="text-2xl font-bold">{number(card.value)}</p>
                <p className="text-sm mt-1">{card.label}</p>
                <p className="text-xs text-muted-foreground mt-2">{card.sub}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>{number(stats.today.visitors)} sessions today</span>
            <span>
              {number(stats.overview.uniqueIPs)} unique IPs · not an exact
              customer count
            </span>
            <span>
              {number(stats.excludedBots)} likely bot sessions{" "}
              {includeBots ? "included" : "excluded"}
            </span>
          </div>
          <Panel title="Shopping funnel">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {steps.map((s, i) => {
                const previous = steps[i - 1]?.value;
                return (
                  <div key={s.label} className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground">
                      {i + 1}. {s.label}
                    </p>
                    <p className="font-bold text-2xl mt-2">{number(s.value)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {i === 0
                        ? "Starting sessions"
                        : previous
                          ? `${Math.round((s.value / previous) * 100)}% of previous step · ${number(previous - s.value)} left this funnel`
                          : "No previous-step activity"}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              One session must follow these steps in order. Cart events and
              order attribution start after deployment; older funnel data is
              incomplete. Orders are checked on the server.
            </p>
          </Panel>
          <div className="grid lg:grid-cols-2 gap-5">
            <Panel title="Daily sessions">
              <div
                className="h-40 grid gap-1 items-end"
                style={{
                  gridTemplateColumns: `repeat(${stats.dailyVisits.length},minmax(0,1fr))`,
                }}
              >
                {stats.dailyVisits.map((d) => (
                  <div
                    key={d.date}
                    className="h-full flex items-end relative group"
                  >
                    <button
                      aria-label={`${d.date}: ${d.visitors} sessions, ${d.uniqueIPs} unique IPs`}
                      title={`${d.date}: ${d.visitors} sessions · ${d.uniqueIPs} unique IPs`}
                      className="w-full bg-primary/70 hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-t"
                      style={{
                        height: `${(d.visitors / max) * 100}%`,
                        minHeight: d.visitors ? 2 : 0,
                      }}
                    />
                    <div className="hidden group-hover:block group-focus-within:block absolute bottom-full mb-2 bg-popover border border-border p-2 rounded text-xs z-10 whitespace-nowrap">
                      {d.date}: {d.visitors} sessions
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>{stats.dailyVisits[0]?.date}</span>
                <span>
                  {stats.dailyVisits[stats.dailyVisits.length - 1]?.date}
                </span>
              </div>
            </Panel>
            <Panel title="Traffic sources">
              <div className="space-y-3">
                {stats.trafficSources.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between gap-3 text-sm border-b border-border/60 pb-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate">{s.source}</p>
                      <p className="text-xs text-muted-foreground break-words">
                        {[s.channel, s.medium, s.campaign]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0">{number(s.count)} sessions</span>
                  </div>
                ))}
                {!stats.trafficSources.length && (
                  <p className="text-sm text-muted-foreground">
                    No traffic yet.
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Based on the first referrer or UTM campaign. Missing referrers
                appear as Direct / unknown; this does not prove a visitor typed
                the address.
              </p>
            </Panel>
            <Panel title="Most-viewed products">
              <div className="space-y-3">
                {stats.topProducts.map((p) => (
                  <div
                    key={p.slug}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <Link
                      className="hover:text-primary min-w-0"
                      to={`/products/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {p.name}
                    </Link>
                    <span className="text-muted-foreground text-right shrink-0">
                      {number(p.views)} views
                      <br />
                      {number(p.sessions)} sessions
                    </span>
                  </div>
                ))}
                {!stats.topProducts.length && (
                  <p className="text-sm text-muted-foreground">
                    No product views recorded in this period.
                  </p>
                )}
              </div>
            </Panel>
            <Panel title="Top landing pages">
              <Breakdown
                rows={stats.topPages.map((r) => ({
                  label: pageLabel(r.page),
                  count: r.count,
                }))}
              />
            </Panel>
            <Panel title="Devices">
              <Breakdown
                rows={stats.devices.map((r) => ({
                  label: r.device,
                  count: r.count,
                }))}
              />
            </Panel>
            <Panel title="Browsers">
              <Breakdown
                rows={stats.browsers.map((r) => ({
                  label: r.browser,
                  count: r.count,
                }))}
              />
            </Panel>
            <Panel title="Top countries">
              <Breakdown
                rows={stats.topCountries.map((r) => ({
                  label: r.country,
                  count: r.count,
                }))}
              />
            </Panel>
            <Panel title="Top cities (approximate)">
              <Breakdown
                rows={stats.topCities.map((r) => ({
                  label: `${r.city}, ${r.country || "Unknown"}`,
                  count: r.count,
                }))}
              />
            </Panel>
          </div>
          <section className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold">Visitor sessions</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {number(stats.visitorsPagination.total)} sessions · expand a row
                to see the full journey.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40">
                  <tr>
                    {[
                      "Session / IP",
                      "Landing page",
                      "Source",
                      "Location",
                      "Device",
                      "Started (IST)",
                      "Journey",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentVisitors.map((v) => (
                    <Fragment key={v.id}>
                      <tr className="align-top">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs">{v.ip}</span>
                          {v.isBot && (
                            <span className="block text-xs text-primary">
                              Likely bot
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[220px] break-words">
                          {pageLabel(v.page)}
                        </td>
                        <td className="px-4 py-3">
                          {v.traffic.source}
                          <span className="block text-xs text-muted-foreground">
                            {v.traffic.channel}
                            {v.campaign ? ` · ${v.campaign}` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {[v.city, v.country].filter(Boolean).join(", ") ||
                            "Unknown"}
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {v.device}
                          <span className="block text-xs text-muted-foreground">
                            {v.browser} · {v.os}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {time(v.createdAt)}
                          <span className="block text-xs">
                            Last activity: {time(v.lastSeenAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            aria-expanded={expanded === v.id}
                            aria-label={`View journey for ${v.ip}`}
                            onClick={() =>
                              setExpanded(expanded === v.id ? null : v.id)
                            }
                            className="text-primary inline-flex items-center gap-2 whitespace-nowrap"
                          >
                            {v.pageViewCount} pages{" "}
                            {expanded === v.id ? (
                              <ChevronUp size={15} />
                            ) : (
                              <ChevronDown size={15} />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expanded === v.id && (
                        <tr>
                          <td colSpan={7}>
                            <Journey id={v.id} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {!stats.recentVisitors.length && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No sessions in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 flex items-center justify-end gap-3 border-t border-border text-sm">
              <button
                className="disabled:opacity-40"
                disabled={loading || !stats.visitorsPagination.hasPrev}
                onClick={() => {
                  setPage(stats.visitorsPagination.page - 1);
                  setExpanded(null);
                }}
              >
                Previous
              </button>
              <span>
                {stats.visitorsPagination.page} /{" "}
                {stats.visitorsPagination.totalPages}
              </span>
              <button
                className="disabled:opacity-40"
                disabled={loading || !stats.visitorsPagination.hasNext}
                onClick={() => {
                  setPage(stats.visitorsPagination.page + 1);
                  setExpanded(null);
                }}
              >
                Next
              </button>
            </div>
          </section>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {stats.notes} Signed-in admin activity and private account pages are
            excluded from new tracking. Anonymous staff visits cannot be
            identified automatically. Locations are estimates from network IP
            addresses.
          </p>
        </>
      )}
    </div>
  );
}
