import React, { useEffect, useMemo, useState } from "react";
import { dashboardStyles as s } from "../assets/dummyStyles.js";
import {
  BadgeIndianRupee,
  CalculatorIcon,
  Calendar,
  CalendarRange,
  CheckCircle,
  Search,
  UserRoundCheck,
  Users,
  XCircle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const API_PATHS = {
  patientCount: "/api/appointments/patients/count",
  doctorCount: "/api/doctors/count",
  doctorCountStream: "/api/doctors/count/stream",
  doctors: "/api/doctors?limit=200",
  dashboardStats: "/api/doctors/dashboard-stats",
};

const API_BASE_CANDIDATES = [
  API_BASE,
  "",
 "http://localhost:4000",
].filter((v, i, arr) => Boolean(v) || i === 1 || arr.indexOf(v) === i);

const buildApiUrl = (base, path) => `${base}${path}`;

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const parseMaybeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function fetchJsonWithFallback(path, options = {}) {
  let lastError = null;

  for (const base of API_BASE_CANDIDATES) {
    const url = buildApiUrl(base, path);
    try {
      const res = await fetch(url, { cache: "no-store", ...options });
      if (!res.ok) {
        lastError = new Error(`Request failed (${res.status}) for ${url}`);
        continue;
      }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        lastError = new Error(`Non-JSON response for ${url}`);
        continue;
      }
      const body = await res.json().catch(() => ({}));
      return body;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to fetch from all API endpoints");
}

function _normalizeDoctor(doc) {
  const id = doc._id || doc.id || String(Math.random()).slice(2);
  const name =
    doc.name ||
    doc.fullName ||
    `${doc.firstName || ""} ${doc.lastName || ""}`.trim() ||
    "Unknown";
  const specialization =
    doc.specialization ||
    doc.speciality ||
    (Array.isArray(doc.specializations)
      ? doc.specializations.join(", ")
      : "") ||
    "General";
  const fee = safeNumber(
    doc.fee ?? doc.fees ?? doc.consultationFee ?? doc.consultation_fee ?? 0,
    0,
  );
  const image =
    doc.imageUrl ||
    doc.image ||
    doc.avatar ||
    `https://i.pravatar.cc/150?u=${id}`;

  const appointments = {
    total:
      doc.appointments?.total ??
      doc.totalAppointments ??
      doc.appointmentsTotal ??
      0,
    completed:
      doc.appointments?.completed ??
      doc.completedAppointments ??
      doc.appointmentsCompleted ??
      0,
    canceled:
      doc.appointments?.canceled ??
      doc.canceledAppointments ??
      doc.appointmentsCanceled ??
      0,
  };

  let earnings = null;
  if (doc.earnings !== undefined && doc.earnings !== null)
    earnings = safeNumber(doc.earnings, 0);
  else if (doc.revenue !== undefined && doc.revenue !== null)
    earnings = safeNumber(doc.revenue, 0);
  else if (appointments.completed && fee)
    earnings = fee * safeNumber(appointments.completed, 0);
  else earnings = 0;

  return {
    id,
    name,
    specialization,
    fee,
    image,
    appointments,
    earnings,
    raw: doc,
  };
}

const DashboardPage = () => {
  const [_doctors, _setDoctors] = useState([]);
  const [_doctorCount, _setDoctorCount] = useState(null);
  const [_stats, _setStats] = useState({
    totalDoctors: null,
    totalAppointments: null,
    totalEarnings: null,
    completed: null,
    canceled: null,
  });
  const [_loading, _setLoading] = useState(false);
  const [_error, _setError] = useState(null);

  const [_patientCount, _setPatientCount] = useState(0);
  const [_patientCountLoading, _setPatientCountLoading] = useState(false);

  const [_query, _setQuery] = useState("");
  const [_showAll, _setShowAll] = useState(false);

  const loadDoctors = React.useCallback(async () => {
    _setLoading(true);
    _setError(null);
    try {
      const body = await fetchJsonWithFallback(API_PATHS.doctors);
      let list = [];
      if (Array.isArray(body)) list = body;
      else if (Array.isArray(body.doctors)) list = body.doctors;
      else if (Array.isArray(body.data)) list = body.data;
      else if (Array.isArray(body.items)) list = body.items;
      else {
        const firstArray = Object.values(body).find((v) => Array.isArray(v));
        if (firstArray) list = firstArray;
      }
      if (!Array.isArray(list)) {
        throw new Error("Invalid doctors payload");
      }
      const normalized = list.map((d) => _normalizeDoctor(d));
      _setDoctors(normalized);
    } catch (err) {
      console.error("Failed to load doctors:", err);
      _setError(err.message || "Failed to load doctors");
    } finally {
      _setLoading(false);
    }
  }, []);

  const loadDoctorCount = React.useCallback(async () => {
    try {
      const body = await fetchJsonWithFallback(API_PATHS.doctorCount);
      const count = parseMaybeNumber(body?.count ?? body?.total ?? body?.data);
      if (count !== null) _setDoctorCount(count);
    } catch (err) {
      console.error("Failed to load doctor count:", err);
    }
  }, []);

  const loadDashboardStats = React.useCallback(async () => {
    try {
      const body = await fetchJsonWithFallback(API_PATHS.dashboardStats);
      const stats = body?.stats || {};
      _setStats((prev) => ({
        totalDoctors: parseMaybeNumber(stats.totalDoctors) ?? prev.totalDoctors,
        totalAppointments:
          parseMaybeNumber(stats.totalAppointments) ?? prev.totalAppointments,
        totalEarnings:
          parseMaybeNumber(stats.totalEarnings) ?? prev.totalEarnings,
        completed: parseMaybeNumber(stats.completed) ?? prev.completed,
        canceled: parseMaybeNumber(stats.canceled) ?? prev.canceled,
      }));
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    }
  }, []);

  const refreshDashboardData = React.useCallback(async () => {
    await Promise.all([loadDoctors(), loadDashboardStats(), loadDoctorCount()]);
  }, [loadDoctors, loadDashboardStats, loadDoctorCount]);

  useEffect(() => {
    refreshDashboardData();

    const intervalId = window.setInterval(refreshDashboardData, 15000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshDashboardData();
    };
    window.addEventListener("focus", refreshDashboardData);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDashboardData);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshDashboardData]);

  useEffect(() => {
    let closed = false;
    let source = null;
    let retryTimer = null;
    let candidateIndex = 0;

    const connect = () => {
      if (closed) return;
      const base =
        API_BASE_CANDIDATES[candidateIndex % API_BASE_CANDIDATES.length];
      const url = buildApiUrl(base, API_PATHS.doctorCountStream);

      try {
        source = new EventSource(url);
      } catch {
        candidateIndex += 1;
        retryTimer = window.setTimeout(connect, 1500);
        return;
      }

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data || "{}");
          const count = parseMaybeNumber(payload?.count);
          if (count !== null) _setDoctorCount(count);
        } catch (err) {
          console.error("doctorCount stream parse error:", err);
        }
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (closed) return;
        candidateIndex += 1;
        retryTimer = window.setTimeout(connect, 1500);
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      source?.close();
    };
  }, []);

  useEffect(() => {
    loadDoctorCount();
    const pollId = window.setInterval(loadDoctorCount, 3000);
    return () => window.clearInterval(pollId);
  }, [loadDoctorCount]);

  useEffect(() => {
    let mounted = true;
    async function loadPatientCount() {
      _setPatientCountLoading(true);
      try {
        const body = await fetchJsonWithFallback(API_PATHS.patientCount);
        const count = Number(
          body?.count ?? body?.totalUsers ?? body?.data ?? 0,
        );
        if (mounted) _setPatientCount(isNaN(count) ? 0 : count);
      } catch (err) {
        console.error("Failed to fetch patient count:", err);
        if (mounted) _setPatientCount(0);
      } finally {
        if (mounted) _setPatientCountLoading(false);
      }
    }
    loadPatientCount();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const fallbackAppointments = _doctors.reduce(
      (s, d) => s + safeNumber(d.appointments?.total, 0),
      0,
    );
    const fallbackEarnings = _doctors.reduce(
      (s, d) => s + safeNumber(d.earnings, 0),
      0,
    );
    const fallbackCompleted = _doctors.reduce(
      (s, d) => s + safeNumber(d.appointments?.completed, 0),
      0,
    );
    const fallbackCanceled = _doctors.reduce(
      (s, d) => s + safeNumber(d.appointments?.canceled, 0),
      0,
    );
    const totalLoginPatients =
      _doctors.reduce((s, d) => s + (d.raw?.loginPatientsCount ?? 0), 0) || 0;
    const statsDoctorCount = Number.isFinite(Number(_stats.totalDoctors))
      ? Number(_stats.totalDoctors)
      : null;
    const backendDoctorCount = Number.isFinite(Number(_doctorCount))
      ? Number(_doctorCount)
      : null;
    return {
      totalDoctors:
        backendDoctorCount !== null
          ? backendDoctorCount
          : statsDoctorCount !== null
            ? statsDoctorCount
            : _doctors.length,
      totalAppointments: Number.isFinite(Number(_stats.totalAppointments))
        ? Number(_stats.totalAppointments)
        : fallbackAppointments,
      totalEarnings: Number.isFinite(Number(_stats.totalEarnings))
        ? Number(_stats.totalEarnings)
        : fallbackEarnings,
      completed: Number.isFinite(Number(_stats.completed))
        ? Number(_stats.completed)
        : fallbackCompleted,
      canceled: Number.isFinite(Number(_stats.canceled))
        ? Number(_stats.canceled)
        : fallbackCanceled,
      totalLoginPatients,
    };
  }, [_doctorCount, _doctors, _stats]);

  const filteredDoctors = useMemo(() => {
    if (!_query) return _doctors;
    const q = _query.trim().toLowerCase();
    const qNum = Number(q);
    return _doctors.filter((d) => {
      if (d.name.toLowerCase().includes(q)) return true;
      if ((d.specialization || "").toLowerCase().includes(q)) return true;
      if (d.fee.toString().includes(q)) return true;
      if (!Number.isNaN(qNum) && d.fee <= qNum) return true;
      return false;
    });
  }, [_doctors, _query]);

  const INITIAL_COUNT = 8;
  const _visibleDoctors = _showAll
    ? filteredDoctors
    : filteredDoctors.slice(0, INITIAL_COUNT);
  return (
    <div className={s.pageContainer}>
      <div className={s.maxWidthContainer}>
        <div className={s.headerContainer}>
          <div>
            <h1 className={s.headerTitle}>DASHBOARD</h1>
            <p className={s.headerSubtitle}>
              Overview of doctors & appointments.
            </p>
          </div>
        </div>

        <div className={s.statsGrid}>
          <StateCard
            icon={<Users className="w-6 h-6 text-emerald-600" />}
            label="total Doctors"
            value={totals.totalDoctors}
          />
          <StateCard
            icon={<UserRoundCheck className="w-6 h-6 text-emerald-600" />}
            label="total Registered Users"
            value={
              _patientCountLoading
                ? "Loading..."
                : (_patientCount ?? totals.totalLoginPatients)
            }
          />
          <StateCard
            icon={<CalendarRange className="w-6 h-6 text-emerald-600" />}
            label="Total Appointments"
            value={totals.totalAppointments}
          />
          <StateCard
            icon={<BadgeIndianRupee className="w-6 h-6 text-emerald-600" />}
            label="Total Earnings"
            value={`₹ ${totals.totalEarnings.toLocaleString("en-IN")}`}
          />
          <StateCard
            icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
            label="Completed Appointments"
            value={totals.completed}
          />
          <StateCard
            icon={<XCircle className="w-6 h-6 text-emerald-600" />}
            label="Canceled Appointments"
            value={totals.canceled}
          />
        </div>

        <div className="mb-6">
          <label className={s.searchLabel}>Search Doctors</label>
          <div className={s.searchContainer}>
            <div className={s.searchInputContainer}>
              <input
                value={_query}
                onChange={(e) => _setQuery(e.target.value)}
                className={s.searchInput}
                placeholder="Search name / specialization / fee"
              />
              <Search className={s.searchIcon} />
            </div>
            <button
              onClick={() => {
                _setQuery("");
                _setShowAll(false);
              }}
              className={s.clearButton}
            >
              Clear
            </button>
          </div>
        </div>

        <div className={s.tableContainer}>
          <div className={s.tableHeader}>
            <h2 className={s.tableTitle}> Doctors</h2>
            <p className={s.tableCount}>
              {_loading
                ? "Loading..."
                : `Showing ${_visibleDoctors.length} of ${filteredDoctors.length} doctors`}
            </p>
          </div>
          {_error && (
            <div className={s.errorContainer}>
              Error loading doctors: {_error}
            </div>
          )}

          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead className={s.tableHead}>
                <tr>
                  <th className={s.tableHeaderCell}>Doctor</th>
                  <th className={s.tableHeaderCell}>Specialization</th>
                  <th className={s.tableHeaderCell}>Fee</th>
                  <th className={s.tableHeaderCell}>Appointments</th>
                  <th className={s.tableHeaderCell}>Completed</th>
                  <th className={s.tableHeaderCell}>Canceled</th>
                  <th className={s.tableHeaderCell}>Total Earnings</th>
                </tr>
              </thead>
              <tbody className={s.tableBody}>
                {_visibleDoctors.map((d, idx) => (
                  <tr
                    key={d.id}
                    className={
                      s.tableRow +
                      " " +
                      (idx % 2 === 0 ? s.tableRowEven : s.tableRowOdd)
                    }
                  >
                    <td className={s.tableCell + " " + s.tableCellFlex}>
                      <div className={s.verticalLine} />
                      <img
                        src={d.image}
                        alt={d.name}
                        className={s.doctorImage}
                      />
                      <div>
                        <div className={s.doctorName}>{d.name}</div>
                        <div className={s.doctorId}>ID: {d.id}</div>
                      </div>
                    </td>

                    <td className={s.tableCell + " " + s.doctorSpecialization}>
                      {d.specialization}
                    </td>

                    <td className={s.tableCell + " " + s.feeText}>₹ {d.fee}</td>

                    <td className={s.tableCell + " " + s.appointmentsText}>
                      {d.appointments.total}
                    </td>

                    <td className={s.tableCell + " " + s.completedText}>
                      {d.appointments.completed}
                    </td>

                    <td className={s.tableCell + " " + s.canceledText}>
                      {d.appointments.canceled}
                    </td>

                    <td className={s.tableCell + " " + s.earningsText}>
                      ₹ {d.earnings.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={s.mobileDoctorContainer}>
            <div className={s.mobileDoctorCard}>
              {_visibleDoctors.map((d) => (
                <MobileDoctorCard key={d.id} d={d} />
              ))}
            </div>
          </div>
          {filteredDoctors.length > INITIAL_COUNT && (
            <div className={s.showMoreContainer}>
              <button
                onClick={() => _setShowAll((s) => !s)}
                className={s.showMoreButton + " " + s.cursorPointer}
              >
                {_showAll
                  ? "Show less"
                  : `Show more (${filteredDoctors.length - INITIAL_COUNT})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

function StateCard({ icon, label, value }) {
  return (
    <div className={s.statCard}>
      <div className={s.statCardContent}>
        <div className={s.statIconContainer}>{icon}</div>
        <div className="flex-1">
          <div className={s.statLabel}>{label}</div>
          <div className={s.statValue}>{value}</div>
        </div>
      </div>
    </div>
  );
}

function MobileDoctorCard({ d }) {
  return (
    <div className={s.mobileDoctorCard}>
      <div className={s.mobileDoctorHeader}>
        <div className="flex items-center gap-3">
          <img src={d.image} alt={d.name} className={s.mobileDoctorImage} />
          <div>
            <div className={s.mobileDoctorName}>{d.name}</div>
            <div className={s.mobileDoctorSpecialization}>
              {d.specialization}
            </div>
          </div>
        </div>
        <div className={s.mobileDoctorFee}>₹ {d.fee}</div>
      </div>

      <div className={s.mobileStatsGrid}>
        <div>
          <div className={s.mobileStatLabel}>Appts</div>
          <div className={s.mobileStatValue}>{d.appointments.total}</div>
        </div>
        <div>
          <div className={s.mobileStatLabel}>Appts</div>
          <div className={s.mobileStatValue + " " + s.textEmerald600}>
            {d.appointments.completed}
          </div>
        </div>

        <div>
          <div className={s.mobileStatLabel}>Cancel</div>
          <div className={s.mobileStatValue + " " + s.textRose500}>
            {d.appointments.canceled}
          </div>
        </div>
      </div>

      <div className={s.mobileEarningsContainer}>
        <div>Earned</div>
        <div className="font-semibold">₹ {d.earnings.toLocaleString()}</div>
      </div>
    </div>
  );
}

