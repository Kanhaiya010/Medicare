import React, { useEffect, useMemo, useState } from "react";
import {
  pageStyles,
  statusClasses,
  keyframesStyles,
} from "../assets/dummyStyles.js";
import { BadgeIndianRupee, Calendar, Search } from "lucide-react";

const API_BASE = "http://localhost:4000"


function _formatDateISO(iso) {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function _dateTimeFromSlot(slot) {
  try {
    const [y, m, d] = slot.date.split("-");
    const base = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);

    const [time, ampm] = slot.time.split(" ");
    let [hh, mm] = time.split(":").map(Number);
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    base.setHours(hh, mm, 0, 0);
    return base;
  } catch {
    return new Date(slot.date + "T00:00:00");
  }
}

const AppointmentsPage = () => {
  //export default function AppointmentsPage() {
  const _isAdmin = true;

  const [_appointments, _setAppointments] = useState([]);
  const [_loading, _setLoading] = useState(false);
  const [_error, _setError] = useState(null);

  const [_query, _setQuery] = useState("");
  const [_filterDate, _setFilterDate] = useState("");
  const [_filterSpeciality, _setFilterSpeciality] = useState("all");
  const [_showAll, _setShowAll] = useState(false);

  useEffect(() => {
    async function load() {
      _setLoading(true);
      _setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/appointments?limit=200`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Failed to load (${res.status})`);
        }
        const body = await res.json();
        const rawList = Array.isArray(body?.appointments)
          ? body.appointments
          : Array.isArray(body?.items)
            ? body.items
            : Array.isArray(body?.data)
              ? body.data
              : [];

        const items = rawList.map((a) => ({
          id: a._id || a.id,
          patientName: a.patientName || "",
          age: a.age || "",
          gender: a.gender || "",
          mobile: a.mobile || "",
          doctorName: (a.doctorId && a.doctorId.name) || a.doctorName || "",
          speciality:
            (a.doctorId && a.doctorId.specialization) ||
            a.speciality ||
            a.specialization ||
            "General",
          fee: typeof a.fees === "number" ? a.fees : a.fee || 0,
          slot: {
            date: a.date || (a.slot && a.slot.date) || "",
            time: a.time || (a.slot && a.slot.time) || "00:00 AM",
          },
          status: a.status || (a.payment && a.payment.status) || "Pending",
          raw: a,
        }));
        _setAppointments(items);
      } catch (err) {
        console.error("load appointments error:", err);
        _setError(err.message || "Failed to load appointments");
        _setAppointments([]);
      } finally {
        _setLoading(false);
      }
    }
    load();
  }, []);

  const _specialities = useMemo(() => {
    const set = new Set(_appointments.map((a) => a.speciality || "General"));
    return ["all", ...Array.from(set)];
  }, [_appointments]);

  const filtered = useMemo(() => {
    const q = _query.trim().toLowerCase();
    return _appointments.filter((a) => {
      if (
        _filterSpeciality !== "all" &&
        (a.speciality || "").toLowerCase() !== _filterSpeciality.toLowerCase()
      )
        return false;
      if (_filterDate && a.slot?.date !== _filterDate) return false;
      if (!q) return true;
      return (
        (a.doctorName || "").toLowerCase().includes(q) ||
        (a.speciality || "").toLowerCase().includes(q) ||
        (a.patientName || "").toLowerCase().includes(q) ||
        (a.mobile || "").toLowerCase().includes(q)
      );
    });
  }, [_appointments, _query, _filterDate, _filterSpeciality]);

  const sortedFiltered = useMemo(() => {
    return filtered.slice().sort((a, b) => {
      const da = _dateTimeFromSlot(a.slot).getTime();
      const db = _dateTimeFromSlot(b.slot).getTime();
      return db - da;
    });
  }, [filtered]);

  const _displayed = useMemo(
    () => (_showAll ? sortedFiltered : sortedFiltered.slice(0, 8)),
    [sortedFiltered, _showAll],
  );

  async function _adminCancelAppointment(id) {
    const appt = _appointments.find((x) => x.id === id);
    if (!appt) return;

    const statusLower = (appt.status || "").toLowerCase();
    const isCancelled =
      statusLower === "canceled" || statusLower === "cancelled";
    const isCompleted = statusLower === "completed";

    if (isCancelled || isCompleted) return;

    const ok = window.confirm(
      `As admin, mark appointment for ${appt.patientName} with ${
        appt.doctorName
      } on ${_formatDateISO(appt.slot.date)} at ${appt.slot.time} as CANCELLED?`,
    );
    if (!ok) return;

    try {
      _setAppointments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "Canceled" } : p)),
      );
      _setShowAll(true);

      const res = await fetch(`${API_BASE}/api/appointments/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Cancel failed (${res.status})`);
      }
      const data = await res.json();
      const updated = data?.appointment || data?.appointments || null;
      if (updated) {
        _setAppointments((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: updated.status || "Canceled",
                  slot: {
                    date: updated.date || p.slot.date,
                    time: updated.time || p.slot.time,
                  },
                  raw: updated,
                }
              : p,
          ),
        );
      }
    } catch (err) {
      console.error("Cancel error:", err);
      _setError(err.message || "Failed to cancel appointment");
      try {
        const reload = await fetch(`${API_BASE}/api/appointments?limit=200`);
        if (reload.ok) {
          const body = await reload.json();
          const rawList = Array.isArray(body?.appointments)
            ? body.appointments
            : Array.isArray(body?.items)
              ? body.items
              : Array.isArray(body?.data)
                ? body.data
                : [];
          const items = rawList.map((a) => ({
            id: a._id || a.id,
            patientName: a.patientName || "",
            age: a.age || "",
            gender: a.gender || "",
            mobile: a.mobile || "",
            doctorName: (a.doctorId && a.doctorId.name) || a.doctorName || "",
            speciality:
              (a.doctorId && a.doctorId.specialization) ||
              a.speciality ||
              a.specialization ||
              "General",
            fee: typeof a.fees === "number" ? a.fees : a.fee || 0,
            slot: {
              date: a.date || (a.slot && a.slot.date) || "",
              time: a.time || (a.slot && a.slot.time) || "00:00 AM",
            },
            status: a.status || (a.payment && a.payment.status) || "Pending",
            raw: a,
          }));
          _setAppointments(items);
        }
      } catch {
        //ignore any error if occure
      }
    }
  }

  return (
    <div className={pageStyles.container}>
      <style>{keyframesStyles}</style>
      <div className={pageStyles.maxWidthContainer}>
        <header className={pageStyles.headerContainer}>
          <div className={pageStyles.headerTitleSection}>
            <h1 className={pageStyles.headerTitle}>Appointments</h1>
            <p className={pageStyles.headerSubtitle}>
              Manage and search upcoming patient appointments.
            </p>
          </div>

          <div className={pageStyles.headerControlsSection}>
            <div className="flex flex-col md:flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className={pageStyles.searchContainer}>
                <Search size={16} className={pageStyles.searchIcon} />

                <input
                  className={pageStyles.searchInput}
                  placeholder="Search doctor, patient, speciality or mobile"
                  value={_query}
                  onChange={(e) => _setQuery(e.target.value)}
                />
              </div>
              <div className={pageStyles.filterContainer}>
                <div className={pageStyles.dateFilter}>
                  <Calendar size={14} className={pageStyles.dateFilterIcon} />
                  <input
                    type="date"
                    className={pageStyles.dateInput}
                    value={_filterDate}
                    onChange={(e) => _setFilterDate(e.target.value)}
                  />
                </div>
                <select
                  className={pageStyles.selectFilter}
                  value={_filterSpeciality}
                  onChange={(e) => _setFilterSpeciality(e.target.value)}
                >
                  {_specialities.map((s) => (
                    <option value={s} key={s}>
                      {s === "all" ? "All Specialties" : s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    _setQuery("");
                    _setFilterDate("");
                    _setFilterSpeciality("all");
                    _setShowAll(false);
                    _setError(null);
                  }}
                  className={pageStyles.clearButton}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </header>
        {_loading ? (
          <div className={pageStyles.loadingErrorContainer}>Loading...</div>
        ) : _error ? (
          <div className={pageStyles.errorContainer}>{_error} </div>
        ) : sortedFiltered.length === 0 ? (
          <div className={pageStyles.noResultsContainer}>
            No appointments found.
          </div>
        ) : (
          <main className={pageStyles.gridContainer}>
            {_displayed.map((a, idx) => {
              const statusLower = (a.status || "").toLowerCase();
              const isCancelled =
                statusLower === "canceled" || statusLower === "cancelled";
              const isCompleted = statusLower === "completed";
              const isDisabled = isCancelled || isCompleted;

              return (
                <div
                  key={a.id}
                  style={{
                    animation: `fadeUp 420ms cubic-bezier(.2,.9,.2,1) forwards`,
                    animationDelay: `${idx * 70}ms`,
                    opacity: 0,
                  }}
                  className={pageStyles.card}
                >
                  <div className={pageStyles.cardHeader}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={pageStyles.cardTitle}>
                          {a.patientName}
                        </h3>

                        <div className={pageStyles.patientInfo}>
                          <span>{a.age ? `${a.age} yrs` : ""}</span>
                          <span> {a.age ? ":" : ""} </span>
                          <span>{a.gender}</span>
                          <span className="hidden md:inline"> : </span>
                          <span className=" max-w-30">{a.mobile}</span>
                        </div>
                      </div>

                      <div className={pageStyles.doctorInfo}>
                        {a.doctorName} :{" "}
                        <span className={pageStyles.doctorSpeciality}>
                          {a.speciality}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={pageStyles.feeLabel}>Fees</div>
                      <div className={pageStyles.feeAmount}>
                        <BadgeIndianRupee size={16} />
                        <span>{a.fee}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className={pageStyles.slotContainer}>
                      <Calendar size={14} className={pageStyles.slotIcon} />
                      <span>
                        {_formatDateISO(a.slot.date)} — {a.slot.time}
                      </span>
                    </div>

                    <div
                      className={`${pageStyles.statusBadge} ${statusClasses(a.status)}`}
                    >
                      {a.status ? a.status.toUpperCase() : "PENDING"}
                    </div>

                    <div className="flex items-center gap-2">
                      {_isAdmin && (
                        <button
                          onClick={() => _adminCancelAppointment(a.id)}
                          title={
                            isDisabled
                              ? isCompleted
                                ? "Cannot cancel a completed appointment"
                                : "Already cancelled"
                              : "Admin Cancel (mark as cancelled)"
                          }
                          disabled={isDisabled}
                          aria-disabled={isDisabled}
                          className={pageStyles.cancelButton(
                            isDisabled,
                            isCompleted,
                          )}
                        >
                          {isDisabled
                            ? isCompleted
                              ? "Completed"
                              : "Admin Cancelled"
                            : "Admin Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </main>
        )}
        {sortedFiltered.length > 8 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => _setShowAll((s) => !s)}
              className={pageStyles.showMoreButton}
            >
              {_showAll
                ? "Show Less"
                : `Show more (${sortedFiltered.length - 8})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;

