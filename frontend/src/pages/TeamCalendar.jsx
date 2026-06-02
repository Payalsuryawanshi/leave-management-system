import { useEffect, useState } from "react";
import { getTeamCalendar } from "../services/leaveService";

export default function TeamCalendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    getTeamCalendar().then((res) => setEvents(res.data)).catch(() => {});
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  const dayNames = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevYear = () => setCurrentDate(new Date(year - 1, month, 1));
  const nextYear = () => setCurrentDate(new Date(year + 1, month, 1));

  const parseDate = (value) => {
    if (typeof value === "string") {
      const [datePart] = value.split("T");
      const [y, m, d] = datePart.split("-").map(Number);
      if (y && m && d) return new Date(y, m - 1, d);
    }
    return new Date(value);
  };

  // Match full calendar dates so every approved leave returned by the team query renders.
  const getLeavesOnDate = (date) => {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return events.filter((e) => {
      const start = parseDate(e.start_date);
      const end = parseDate(e.end_date);
      return checkDate >= start && checkDate <= end;
    });
  };

  // Get leaves for selected date
  const selectedLeaves = getLeavesOnDate(selectedDate);

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long", day: "numeric", month: "short", year: "numeric"
    });
  };

  // Build calendar grid
  const calendarDays = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, currentMonth: false });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, currentMonth: true });
  }
  // Next month days to fill grid
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, currentMonth: false });
  }

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (day) => {
    return day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Team Calendar</h2>
      <div style={styles.body}>

        {/* Left — Calendar */}
        <div style={styles.calendarBox}>
          {/* Month Navigation */}
          <div style={styles.navRow}>
            <button onClick={prevYear} style={styles.navBtn}>«</button>
            <button onClick={prevMonth} style={styles.navBtn}>‹</button>
            <span style={styles.monthLabel}>{monthNames[month]} {year}</span>
            <button onClick={nextMonth} style={styles.navBtn}>›</button>
            <button onClick={nextYear} style={styles.navBtn}>»</button>
          </div>

          {/* Day Headers */}
          <div style={styles.dayGrid}>
            {dayNames.map((d) => (
              <div key={d} style={styles.dayHeader}>{d}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div style={styles.dayGrid}>
            {calendarDays.map((item, i) => {
              const dayDate = new Date(year, month, item.day);
              const leavesOnDay = item.currentMonth ? getLeavesOnDate(dayDate) : [];
              const hasLeave = leavesOnDay.length > 0;
              const todayDay = isToday(item.day) && item.currentMonth;
              const selectedDay = isSelected(item.day) && item.currentMonth;

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (item.currentMonth) {
                      setSelectedDate(new Date(year, month, item.day));
                    }
                  }}
                  style={{
                    ...styles.dayCell,
                    cursor: item.currentMonth ? "pointer" : "default",
                    background: selectedDay ? "#0070f3" : todayDay ? "#e8f4fd" : "transparent",
                    borderRadius: selectedDay || todayDay ? "50%" : 0,
                    color: selectedDay ? "#fff" : item.currentMonth ? "#1a1a2e" : "#ccc",
                    fontWeight: todayDay || selectedDay ? 700 : 400,
                    position: "relative",
                  }}
                >
                  {item.day}
                  {hasLeave && (
                    <div style={{
                      position: "absolute",
                      bottom: 2,
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: 2,
                    }}>
                      {leavesOnDay.slice(0, 3).map((_, idx) => (
                        <div key={idx} style={styles.dot} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — Selected Date Details */}
        <div style={styles.detailBox}>
          <div style={styles.detailHeader}>
            <span style={styles.detailDate}>{formatSelectedDate()}</span>
            <span style={styles.leaveCount}>{selectedLeaves.length} on leave</span>
          </div>
          <h4 style={styles.teamLeaveTitle}>Team Leave</h4>
          {selectedLeaves.length === 0 ? (
            <p style={styles.noLeave}>No team members on leave</p>
          ) : (
            selectedLeaves.map((e, i) => (
              <div key={i} style={styles.leaveItem}>
                <div>
                  <p style={styles.leaveName}>{e.employee_name}</p>
                  <p style={styles.leaveType}>{e.leave_type}</p>
                </div>
                <div style={styles.leaveRight}>
                  <p style={styles.leaveDates}>
                    {String(e.start_date)} to {String(e.end_date)}
                  </p>
                  <span style={styles.approvedBadge}>Approved</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: { padding: 24, maxWidth: 1000, margin: "0 auto" },
  title: { color: "#1a1a2e", marginBottom: 24 },
  body: { display: "flex", gap: 24, alignItems: "flex-start" },

  // Calendar
  calendarBox: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    width: 320,
    flexShrink: 0,
  },
  navRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: {
    background: "none",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    color: "#0070f3",
    padding: "4px 8px",
    borderRadius: 4,
  },
  monthLabel: { fontWeight: 700, fontSize: 16, color: "#1a1a2e" },
  dayGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 2,
  },
  dayHeader: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#888",
    padding: "6px 0",
  },
  dayCell: {
    textAlign: "center",
    padding: "8px 4px",
    fontSize: 13,
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "auto",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#0070f3",
  },

  // Detail Panel
  detailBox: {
    flex: 1,
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    minHeight: 300,
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "1px solid #f0f0f0",
  },
  detailDate: { fontWeight: 700, fontSize: 16, color: "#1a1a2e" },
  leaveCount: { fontSize: 13, color: "#888" },
  teamLeaveTitle: { color: "#333", marginBottom: 12 },
  noLeave: { color: "#888", fontSize: 14 },
  leaveItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "12px 0",
    borderBottom: "1px solid #f5f5f5",
  },
  leaveName: { margin: 0, fontWeight: 600, fontSize: 14, color: "#1a1a2e" },
  leaveType: { margin: "4px 0 0 0", fontSize: 12, color: "#888" },
  leaveRight: { textAlign: "right" },
  leaveDates: { margin: 0, fontSize: 12, color: "#555" },
  approvedBadge: {
    background: "#e8f5e9",
    color: "#27ae60",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    marginTop: 4,
    display: "inline-block",
  },
};
