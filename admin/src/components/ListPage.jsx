import React, { useEffect, useState, useMemo } from "react";
import { doctorListStyles } from "../assets/dummyStyles.js";
import {
  BadgeIndianRupee,
  ChevronDown,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react";

function _formatDateISo(iso) {
  if (!iso || typeof iso !== "string") return iso;
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(Number(d));
  const month = monthNames[dateObj.getMonth()] || "";
  return `${day} ${month} ${y}`;
}

function normalizeToDateString(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().split("T")[0];
}

function _buildScheduleMap(schedule) {
  const map = {};
  if (!schedule || typeof schedule !== "object") return map;
  Object.entries(schedule).forEach(([k, v]) => {
    const nd = normalizeToDateString(k) || String(k);
    map[nd] = Array.isArray(v) ? v.slice() : [];
  });
  return map;
}

function _getSortedScheduleDates(scheduleLike) {
  let keys = [];
  if (Array.isArray(scheduleLike)) {
    keys = scheduleLike.map(normalizeToDateString).filter(Boolean);
  } else if (scheduleLike && typeof scheduleLike === "object") {
    keys = Object.keys(scheduleLike).map(normalizeToDateString).filter(Boolean);
  }

  keys = Array.from(new Set(keys));
  const parsed = keys.map((ds) => ({ ds, date: new Date(ds) }));
  const dateVal = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

  const today = new Date();
  const todayVal = dateVal(today);

  const past = parsed
    .filter((p) => dateVal(p.date) < todayVal)
    .sort((a, b) => dateVal(b.date) - dateVal(a.date));

  const future = parsed
    .filter((p) => dateVal(p.date) >= todayVal)
    .sort((a, b) => dateVal(a.date) - dateVal(b.date));

  return [...past, ...future].map((p) => p.ds);
}

const ListPage = () => {
  const API_BASE = "http://localhost:4000";
  const [_doctors, _setDoctors] = useState([]);
  const [_expanded, _setExpanded] = useState(null);
  const [_query, _setQuery] = useState("");
  const [_showAll, _setShowAll] = useState(false);
  const [_filterStatus, _setFilterStatus] = useState("all");
  const [_loading, _setLoading] = useState(false);
  const [_isMobileScreen, setIsMobileScreen] = useState(false);

  // Screen Resize Effect
  useEffect(() => {
    function onResize() {
      if (typeof window === "undefined") return;
      setIsMobileScreen(window.innerWidth < 640);
    }

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Fetch Doctors
  async function fetchDoctors() {
    _setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctors`);
      const body = await res.json().catch(() => null);

      if (res.ok && body && body.success) {
        const list = Array.isArray(body.data)
          ? body.data
          : Array.isArray(body.doctors)
            ? body.doctors
            : [];

        const normalized = list.map((d) => ({
          ...d,
          schedule: _buildScheduleMap(d.schedule || {}),
        }));

        _setDoctors(normalized);
      } else {
        console.error("Failed to fetch doctors", body);
        _setDoctors([]);
      }
    } catch (err) {
      console.error("Network error fetching doctors", err);
      _setDoctors([]);
    } finally {
      _setLoading(false);
    }
  }

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filtering Logic
  const filtered = useMemo(() => {
    const q = _query.trim().toLowerCase();
    let list = _doctors;

    if (_filterStatus === "available") {
      list = list.filter(
        (d) => (d.availability || "").toLowerCase() === "available",
      );
    } else if (_filterStatus === "unavailable") {
      list = list.filter(
        (d) => (d.availability || "").toLowerCase() !== "available",
      );
    }

    if (!q) return list;

    return list.filter(
      (d) =>
        (d.name || "").toLowerCase().includes(q) ||
        (d.specialization || "").toLowerCase().includes(q),
    );
  }, [_doctors, _query, _filterStatus]);

  const _displayed = useMemo(() => {
    if (_showAll) return filtered;
    return filtered.slice(0, 6);
  }, [filtered, _showAll]);

  function _toggle(id) {
    _setExpanded((prev) => (prev === id ? null : id));
  }

  async function _removeDoctor(id) {
    const doc = _doctors.find((d) => (d._id || d.id) === id);
    if (!doc) return;

    const ok = window.confirm(`Delete ${doc.name}? This cannot be undone.`);
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/doctors/${id}`, {
        method: "DELETE",
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        alert(body?.message || "Failed to delete");
        return;
      }

      _setDoctors((prev) => prev.filter((p) => (p._id || p.id) !== id));
      if (_expanded === id) _setExpanded(null);
    } catch (err) {
      console.error("delete error", err);
      alert("Network error deleting doctor");
    }
  }

  function _applyStatusFilter(status) {
    _setFilterStatus((prev) => (prev === status ? "all" : status));
    _setExpanded(null);
    _setShowAll(false);
  }

  return (
    <div className={doctorListStyles.container}>
      <header className={doctorListStyles.headerContainer}>
        <div className={doctorListStyles.headerTopSection}>
          <div className={doctorListStyles.headerIconContainer}>
            <div className={doctorListStyles.headerIcon}>
              <Users size={20} className={doctorListStyles.headerIconSvg} />
            </div>
            <div>
              <h1 className={doctorListStyles.headerTitle}>Find a Doctor</h1>
              <p className={doctorListStyles.headerSubtitle}>
                Search by name or specialization
              </p>
            </div>
          </div>

          <div className={doctorListStyles.headerSearchContainer}>
            <div className={doctorListStyles.searchBox}>
              <Search size={16} className={doctorListStyles.searchIcon} />
              <input
                value={_query}
                onChange={(e) => _setQuery(e.target.value)}
                placeholder="Search Doctors, Specialization"
                className={doctorListStyles.searchInput}
              />
            </div>
            <button
              onClick={() => {
                _setQuery("");
                _setExpanded(null);
                _setShowAll(false);
                _setFilterStatus("all");
              }}
              className={doctorListStyles.clearButton}
            >
              Clear
            </button>
          </div>
        </div>

        <div className={doctorListStyles.filterContainer}>
          <button
            onClick={() => _applyStatusFilter("available")}
            className={doctorListStyles.filterButton(
              _filterStatus === "available",
              "emerald",
            )}
          >
            Available
          </button>

          <button
            onClick={() => _applyStatusFilter("unavailable")}
            className={doctorListStyles.filterButton(
              _filterStatus === "unavailable",
              "red",
            )}
          >
            Unavailable
          </button>
        </div>
      </header>

      <main className={doctorListStyles.gridContainer}>
        {_loading && (
          <div className={doctorListStyles.loadingContainer}>
            Loading Doctors...
          </div>
        )}
        {!_loading && filtered.length === 0 && (
          <div className={doctorListStyles.noResultsContainer}>
            No doctors match your search.
          </div>
        )}

        {_displayed.map((doc) => {
          const id = doc._id || doc.id;
          const _isOpen = _expanded === id;
          const _isAvailable = doc.availability === "Available";
          const scheduleMap = _buildScheduleMap(doc.schedule || {});
          const sortedDates = _getSortedScheduleDates(scheduleMap);

          return (
            <article key={id} className={doctorListStyles.article}>
              <div className={doctorListStyles.articleContent}>
                <img
                  src={
                    doc.imageUrl ||
                    doc.image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name || "Doctor")}&background=dcfce7&color=065f46`
                  }
                  alt={doc.name}
                  className={doctorListStyles.doctorImage}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name || "Doctor")}&background=dcfce7&color=065f46`;
                  }}
                />

                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                    <h3 className={doctorListStyles.doctorName + " truncate"}>
                      {doc.name}
                    </h3>
                    <span
                      className={doctorListStyles.availabilityBadge(
                        _isAvailable,
                      )}
                    >
                      <span
                        className={doctorListStyles.availabilityDot(
                          _isAvailable,
                        )}
                      />
                      {_isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <p className={doctorListStyles.doctorDetails + " mt-1"}>
                    {doc.specialization || "General"}
                    {doc.experience ? ` · ${doc.experience} yrs` : ""}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                    <span className={doctorListStyles.statsValue}>
                      {" "}
                      Patients: <Users size={13} /> {doc.patients || "N/A"}
                    </span>
                    <button
                      onClick={() => _removeDoctor(id)}
                      className={doctorListStyles.deleteButton}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                    <div className={doctorListStyles.feesLabel}>Fees:</div>
                    <div
                      className={`${doctorListStyles.feesValue} bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full shadow-sm`}
                    >
                      <BadgeIndianRupee size={14} />
                      {doc.fee}
                    </div>
                  </div>
                </div>

                <div className="flex w-full sm:w-auto items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                  <div className={doctorListStyles.rating}>
                    <Star size={14} />
                    {Number(doc.rating || 0).toFixed(1)}
                  </div>
                  <button
                    onClick={() => _toggle(id)}
                    className={doctorListStyles.toggleButton(_isOpen)}
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              </div>
              <div
                className={doctorListStyles.expandableContent}
                style={{
                  maxHeight: _isOpen ? (_isMobileScreen ? 900 : 1100) : 0,
                  transition:
                    "max-height 420ms cubic-bezier(.2,.9,.2,1), padding 220ms ease",
                  paddingTop: _isOpen ? 16 : 0,
                  paddingBottom: _isOpen ? 16 : 0,
                }}
              >
                {_isOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className={doctorListStyles.aboutSection}>
                      <h4 className={doctorListStyles.aboutHeading}>About</h4>
                      <p className={doctorListStyles.aboutText}>
                        {doc.about || "No about information added."}
                      </p>

                      <div className="mt-4">
                        <div className={doctorListStyles.qualificationsHeading}>
                          Qualifications
                        </div>
                        <div className={doctorListStyles.qualificationsText}>
                          {doc.qualifications || "Not provided"}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className={doctorListStyles.scheduleHeading}>
                          Schedule
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sortedDates.length === 0 && (
                            <p className={doctorListStyles.scheduleDate}>
                              No schedule added
                            </p>
                          )}
                          {sortedDates.map((date) => {
                            const slots = scheduleMap[date] || [];
                            return (
                              <div key={date} className="min-w-full md:min-w-0">
                                <div className={doctorListStyles.scheduleDate}>
                                  {_formatDateISo(date)}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {slots.map((s, i) => (
                                    <span
                                      key={i}
                                      className={doctorListStyles.scheduleSlot}
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <aside className={doctorListStyles.statsSidebar}>
                      <div className={doctorListStyles.statsItemHeading}>
                        Success
                      </div>
                      <div className={doctorListStyles.statsItemValue}>
                        {doc.success ? `${doc.success}%` : "N/A"}
                      </div>

                      <div className={doctorListStyles.statsItemHeading}>
                        Patients
                      </div>
                      <div className={doctorListStyles.statsItemValue}>
                        {doc.patients || "N/A"}
                      </div>

                      <div className={doctorListStyles.statsItemHeading}>
                        Location
                      </div>
                      <div className={doctorListStyles.locationValue}>
                        {doc.location || "N/A"}
                      </div>
                    </aside>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {filtered.length > 6 && (
          <div className={doctorListStyles.showMoreContainer}>
            <button
              onClick={() => _setShowAll((s) => !s)}
              className={doctorListStyles.showMoreButton}
            >
              {_showAll ? "Show Less" : `Show more (${filtered.length - 6})`}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ListPage;

