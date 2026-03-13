import React, { useCallback, useEffect, useRef, useState } from "react";
import { serviceDashboardStyles } from "../assets/dummyStyles.js";
import {
  CalendarCheck2,
  CircleCheckBig,
  CircleX,
  IndianRupee,
  Search,
  ShieldCheck,
  XCircle,
  Calendar,
  CheckCircle,
  BadgeIndianRupee,
} from "lucide-react";

function _normalizeService(doc) {
  if (!doc) return null;
  const id = doc._id || doc.id || String(Math.random()).slice(2);
  const name = doc.name || doc.title || doc.serviceName || "Untitled Service";
  const price =
    Number(doc.price ?? doc.fee ?? doc.fees ?? doc.cost ?? doc.amount) || 0;
  const image =
    doc.imageUrl ||
    doc.image ||
    doc.avatar ||
    `https://i.pravatar.cc/150?u=${id}`;
  // various possible stat shapes
  const totalAppointments =
    doc.totalAppointments ??
    doc.appointments?.total ??
    doc.count ??
    doc.stats?.total ??
    doc.bookings ??
    0;
  const completed =
    doc.completed ??
    doc.appointments?.completed ??
    doc.stats?.completed ??
    doc.completedAppointments ??
    0;
  const canceled =
    doc.canceled ??
    doc.appointments?.canceled ??
    doc.stats?.canceled ??
    doc.canceledAppointments ??
    0;

  return {
    id,
    name,
    price,
    image,
    totalAppointments: Number(totalAppointments) || 0,
    completed: Number(completed) || 0,
    canceled: Number(canceled) || 0,
    raw: doc,
  };
}
const API_BASE = "http://localhost:4000";
const ServiceDashboard = ({ services: servicesProp = null }) => {
  const [services, setServices] = useState(
    Array.isArray(servicesProp) ? servicesProp.map(_normalizeService) : [],
  );
  const [serviceCount, setServiceCount] = useState(
    Array.isArray(servicesProp) ? servicesProp.length : null,
  );
  const [loading, setLoading] = useState(!Array.isArray(servicesProp));
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const pollHandleRef = useRef(null);

  const buildFetchOptions = useCallback(() => {
    const opts = {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    };
    const token = localStorage.getItem("authToken");
    if (token) opts.headers["Authorization"] = `Bearer ${token}`;
    return opts;
  }, []);

  const fetchServices = useCallback(
    async ({ showLoading = true } = {}) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        if (showLoading) {
          setLoading(true);
          setError(null);
        }

        const url = `${API_BASE}/api/service-appointments/stats/summary`;
        const res = await fetch(url, buildFetchOptions());
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.message || `Failed to fetch services (${res.status})`,
          );
        }
        const body = await res.json();

        let list = [];
        if (Array.isArray(body)) list = body;
        else if (Array.isArray(body.services)) list = body.services;
        else if (Array.isArray(body.data)) list = body.data;
        else if (Array.isArray(body.items)) list = body.items;
        else {
          const maybeArray = Object.values(body).find((v) => Array.isArray(v));
          if (maybeArray) list = maybeArray;
        }

        const normalized = (list || []).map(_normalizeService).filter(Boolean);
        const explicitCount = Number(
          body?.totalServices ??
            body?.serviceCount ??
            body?.count ??
            body?.total ??
            body?.data?.totalServices ??
            body?.data?.serviceCount ??
            body?.stats?.totalServices,
        );
        const nextCount = Number.isFinite(explicitCount)
          ? explicitCount
          : normalized.length;

        if (mountedRef.current) {
          setServices(normalized);
          setServiceCount(nextCount);
          setError(null);
        }
      } catch (err) {
        console.error("Service fetch error:", err);
        if (mountedRef.current) {
          setError(err.message || "Failed to load services");
        }
      } finally {
        if (mountedRef.current && showLoading) setLoading(false);
        fetchingRef.current = false;
      }
    },
    [buildFetchOptions],
  );

  useEffect(() => {
    window.refreshServices = () => fetchServices({ showLoading: true });
    return () => {
      try {
        delete window.refreshServices;
      } catch {
        // ignore
      }
    };
  }, [fetchServices]);

  useEffect(() => {
    mountedRef.current = true;
    if (Array.isArray(servicesProp)) {
      setServices(servicesProp.map(_normalizeService));
      setServiceCount(servicesProp.length);
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    fetchServices({ showLoading: true });
    function startPolling() {
      if (pollHandleRef.current) return;
      pollHandleRef.current = setInterval(() => {
        if (document.visibilityState === "visible")
          fetchServices({ showLoading: false });
      }, 10000);
    }

    function stopPolling() {
      if (pollHandleRef.current) {
        clearInterval(pollHandleRef.current);
        pollHandleRef.current = null;
      }
    }

    startPolling();

    function onFocus() {
      fetchServices({ showLoading: false });
    }
    window.addEventListener("focus", onFocus);

    function onServicesUpdated() {
      fetchServices({ showLoading: false });
    }
    window.addEventListener("services:updated", onServicesUpdated);

    function onStorage(e) {
      if (e?.key === "service_bookings_updated") {
        fetchServices({ showLoading: false });
      }
    }
    window.addEventListener("storage", onStorage);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchServices({ showLoading: false });
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mountedRef.current = false;
      stopPolling();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("services:updated", onServicesUpdated);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [servicesProp, fetchServices]);

  const backendCount =
    serviceCount === null || serviceCount === undefined
      ? services.length
      : serviceCount;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(normalizedQuery),
  );
  const INITIAL_COUNT = 8;
  const visibleServices = showAll
    ? filteredServices
    : filteredServices.slice(0, INITIAL_COUNT);
  const displayCount = normalizedQuery ? filteredServices.length : backendCount;
  const totals = filteredServices.reduce(
    (acc, s) => {
      acc.totalAppointments += s.totalAppointments;
      acc.totalCompleted += s.completed;
      acc.totalCanceled += s.canceled;
      acc.totalEarning += s.completed * s.price;
      return acc;
    },
    {
      totalAppointments: 0,
      totalCompleted: 0,
      totalCanceled: 0,
      totalEarning: 0,
    },
  );
  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  return (
    <div className={serviceDashboardStyles.container}>
      <div className={serviceDashboardStyles.innerContainer}>
        <div className={serviceDashboardStyles.header.container}>
          <div>
            <h1 className={serviceDashboardStyles.header.title}>
              Service Dashboard
            </h1>
            <p className={serviceDashboardStyles.header.subtitle}>
              Overview of services, appointments and earnings
            </p>
          </div>

          <div className={serviceDashboardStyles.refresh.container}>
            <div className={serviceDashboardStyles.refresh.countText}>
              {loading
                ? "Loading..."
                : `${displayCount} service${displayCount !== 1 ? "s" : ""}`}
            </div>

            <button
              onClick={() => {
                if (Array.isArray(servicesProp)) return;
                fetchServices({ showLoading: true });
              }}
              className={serviceDashboardStyles.refresh.button(
                Array.isArray(servicesProp),
              )}
              title={
                Array.isArray(servicesProp)
                  ? "Services provided by parent component"
                  : "Refresh"
              }
            >
              Refresh
            </button>
          </div>
        </div>

        <div className={serviceDashboardStyles.statGrid}>
          <StatCard
            icon={<ShieldCheck size={18} />}
            label="Total Services"
            value={displayCount}
          />
          <StatCard
            icon={<CalendarCheck2 size={18} />}
            label="Total Appointments"
            value={totals.totalAppointments}
          />
          <StatCard
            icon={<IndianRupee size={18} />}
            label="Total Earnings"
            value={formatCurrency(totals.totalEarning)}
          />
          <StatCard
            icon={<CircleCheckBig size={18} />}
            label="Completed"
            value={totals.totalCompleted}
          />
          <StatCard
            icon={<CircleX size={18} />}
            label="Canceled"
            value={totals.totalCanceled}
          />
        </div>

        <div className={serviceDashboardStyles.search.container}>
          <div className={serviceDashboardStyles.search.inputContainer}>
            <Search className="w-4 h-4 text-emerald-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={serviceDashboardStyles.search.input}
              placeholder="Search services..."
            />

            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowAll(false);
                }}
                className="inline-flex items-center justify-center"
                aria-label="Clear search"
                title="Clear search"
              >
                <XCircle size={16} className="text-red-500 cursor-pointer" />
              </button>
            )}
          </div>
        </div>

        <div className={serviceDashboardStyles.table.container}>
          <div className={serviceDashboardStyles.table.headerMd}>
            <div className={serviceDashboardStyles.table.headerText}>
              Service
            </div>
            <div className={serviceDashboardStyles.table.headerText}>
              Appointments
            </div>
            <div className={serviceDashboardStyles.table.headerText}>
              Completed
            </div>
            <div className={serviceDashboardStyles.table.headerText}>
              Canceled
            </div>
            <div className={serviceDashboardStyles.table.headerText}>
              Earning
            </div>
          </div>
          <div className={serviceDashboardStyles.table.headerLg}>
            <div className="col-span-5">Service</div>
            <div className="col-span-2">Price</div>
            <div className={serviceDashboardStyles.table.headerTextLg(1)}>
              Appointments
            </div>
            <div className={serviceDashboardStyles.table.headerTextLg(1)}>
              Completed
            </div>
            <div className={serviceDashboardStyles.table.headerTextLg(1)}>
              Canceled
            </div>
            <div className="col-span-2 text-right">Earning</div>
          </div>
          <div className={serviceDashboardStyles.table.body}>
            {loading ? (
              <div className={serviceDashboardStyles.states.loading}>
                Loading services...
              </div>
            ) : error ? (
              <div className={serviceDashboardStyles.states.error}>
                Error: {error}
              </div>
            ) : visibleServices.length === 0 ? (
              <div className={serviceDashboardStyles.states.empty}>
                No Service found.
              </div>
            ) : (
              visibleServices.map((s) => {
                const _earning = s.completed * s.price;
                return (
                  <div key={s.id} className={serviceDashboardStyles.table.row}>
                    <div className={serviceDashboardStyles.table.tabletView}>
                      <div className="flex items-center gap-3">
                        <div
                          className={serviceDashboardStyles.table.tabletImage}
                        >
                          <img
                            src={s.image}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div
                          className={
                            serviceDashboardStyles.table.tabletTextContainer
                          }
                        >
                          <div
                            className={
                              serviceDashboardStyles.table.tabletServiceName
                            }
                          >
                            {s.name}
                          </div>
                          <div
                            className={serviceDashboardStyles.table.tabletPrice}
                          >
                            {formatCurrency(s.price)}
                          </div>
                        </div>
                      </div>
                      <div className={serviceDashboardStyles.table.tabletCell}>
                        {s.totalAppointments}
                      </div>
                      <div
                        className={`${serviceDashboardStyles.table.tabletCell} text-emerald-700`}
                      >
                        {s.completed}
                      </div>
                      <div
                        className={`${serviceDashboardStyles.table.tabletCell} text-red-500`}
                      >
                        {s.canceled}
                      </div>
                      <div
                        className={`${serviceDashboardStyles.table.tabletCell} text-right`}
                      >
                        {formatCurrency(_earning)}
                      </div>
                    </div>

                    <div className={serviceDashboardStyles.table.desktopView}>
                      <div className="col-span-5 flex items-center gap-4">
                        <div
                          className={serviceDashboardStyles.table.desktopImage}
                        >
                          <img
                            src={s.image}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3
                          className={
                            serviceDashboardStyles.table.desktopServiceName
                          }
                        >
                          {s.name}
                        </h3>
                      </div>
                      <div
                        className={serviceDashboardStyles.table.desktopCell(2)}
                      >
                        {formatCurrency(s.price)}
                      </div>
                      <div
                        className={serviceDashboardStyles.table.desktopCenterCell(
                          1,
                        )}
                      >
                        {s.totalAppointments}
                      </div>
                      <div
                        className={serviceDashboardStyles.table.desktopCenterCell(
                          1,
                        )}
                      >
                        {s.completed}
                      </div>
                      <div
                        className={serviceDashboardStyles.table.desktopCenterCell(
                          1,
                        )}
                      >
                        {s.canceled}
                      </div>
                      <div
                        className={`${serviceDashboardStyles.table.desktopCell(
                          2,
                        )} text-right`}
                      >
                        {formatCurrency(_earning)}
                      </div>
                    </div>

                    <div className={serviceDashboardStyles.table.mobileView}>
                      <div className="flex items-start gap-3">
                        <div
                          className={serviceDashboardStyles.table.mobileImage}
                        >
                          <img
                            src={s.image}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div
                            className={
                              serviceDashboardStyles.table.mobileServiceHeader
                            }
                          >
                            <h3
                              className={
                                serviceDashboardStyles.table.mobileServiceName
                              }
                            >
                              {s.name}
                            </h3>
                            <div className="text-sm font-medium">
                              {formatCurrency(s.price)}
                            </div>
                          </div>

                          <div
                            className={
                              serviceDashboardStyles.table.mobileStatsContainer
                            }
                          >
                            <div
                              className={serviceDashboardStyles.table.mobileStatItem(
                                "emerald",
                              )}
                            >
                              <Calendar size={14} />
                              <span className="leading-none">
                                {s.totalAppointments} Appointments
                              </span>
                            </div>

                            <div
                              className={serviceDashboardStyles.table.mobileStatItem(
                                "emerald",
                              )}
                            >
                              <CheckCircle size={14} />
                              <span className="leading-none text-emerald-700">
                                {s.completed} Completed
                              </span>
                            </div>

                            <div
                              className={serviceDashboardStyles.table.mobileStatItem(
                                "red",
                              )}
                            >
                              <XCircle size={14} />
                              <span className="leading-none text-red-500">
                                {s.canceled} Canceled
                              </span>
                            </div>

                            <div
                              className={serviceDashboardStyles.table.mobileStatItem(
                                "emerald",
                              )}
                            >
                              <BadgeIndianRupee size={14} />
                              <span className="leading-none">
                                Total Earning : {formatCurrency(_earning)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {filteredServices.length >INITIAL_COUNT && (
  <div className={serviceDashboardStyles.showMore.container}>
    <button
      onClick={() => setShowAll((s) => !s)}
      className={serviceDashboardStyles.showMore.button}
    >
      {showAll
        ? "Show less"
        : `Show more (${filteredServices.length - INITIAL_COUNT})`}
    </button>
  </div>
)}

      </div>
    </div>
  );
};

export default ServiceDashboard;
function StatCard({ icon, label, value }) {
  return (
    <div className={serviceDashboardStyles.statCard.container}>
      <div className={serviceDashboardStyles.statCard.iconContainer}>
        {icon}
      </div>
      <div>
        <div className={serviceDashboardStyles.statCard.label}>{label}</div>
        <div className={serviceDashboardStyles.statCard.value}>{value}</div>
      </div>
    </div>
  );
}

