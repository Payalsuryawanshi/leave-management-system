import oracledb
from datetime import date, timedelta
from db import get_connection


def get_holidays_set() -> set:
    """Fetch all mandatory holidays as a set of date objects"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT date_col FROM HOLIDAYS WHERE is_optional = 0")
    holidays = set()
    for row in cursor.fetchall():
        dt = row[0]
        holidays.add(dt.date() if hasattr(dt, 'date') else dt)
    cursor.close()
    conn.close()
    return holidays


def count_working_days(start: date, end: date) -> int:
    """Count working days excluding weekends and holidays"""
    holidays = get_holidays_set()
    count = 0
    current = start
    while current <= end:
        if current.weekday() < 5 and current not in holidays:
            count += 1
        current += timedelta(days=1)
    return count


def get_team_calendar(current_user: dict) -> list:
    """Get approved leaves for everyone reporting to the current user's team manager."""
    team_manager_id = (
        current_user["user_id"]
        if current_user.get("role") in ("manager", "hr")
        else current_user.get("manager_id")
    )
    if not team_manager_id:
        return []

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT u.name, lt.name, l.start_date, l.end_date, l.days_count
           FROM LEAVES l
           JOIN USERS u ON l.user_id = u.user_id
           JOIN LEAVE_TYPES lt ON l.type_id = lt.type_id
           -- Team calendar visibility is based on reporting manager, not department.
           -- This keeps Rahul's and Kavya's teams isolated even if they share a department.
           WHERE u.manager_id = :team_manager_id
           AND l.status = 'Approved'
           ORDER BY l.start_date, u.name""",
        {"team_manager_id": team_manager_id}
    )
    results = []
    for row in cursor.fetchall():
        results.append({
            "employee_name": row[0],
            "leave_type":    row[1],
            "start_date": row[2].date() if hasattr(row[2], 'date') else row[2],
            "end_date":   row[3].date() if hasattr(row[3], 'date') else row[3],
            "days_count": row[4]
        })
    cursor.close()
    conn.close()
    return results


def get_holidays() -> list:
    """Get all holidays ordered by date"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT holiday_id, name, date_col, is_optional FROM HOLIDAYS ORDER BY date_col"
    )
    results = []
    for row in cursor.fetchall():
        results.append({
            "holiday_id":  row[0],
            "name":        row[1],
            "date_col":    row[2].date() if hasattr(row[2], 'date') else row[2],
            "is_optional": bool(row[3])
        })
    cursor.close()
    conn.close()
    return results


def create_holiday(name: str, date_str: str, is_optional: bool) -> int:
    """Create a new holiday"""
    conn = get_connection()
    cursor = conn.cursor()
    new_id_var = cursor.var(oracledb.NUMBER)
    cursor.execute(
        """INSERT INTO HOLIDAYS (holiday_id, name, date_col, is_optional)
           VALUES (HOLIDAY_SEQ.NEXTVAL, :hname, TO_DATE(:hdate, 'YYYY-MM-DD'), :hopt)
           RETURNING holiday_id INTO :new_id""",
        {"hname": name, "hdate": date_str, "hopt": 1 if is_optional else 0, "new_id": new_id_var}
    )
    conn.commit()
    holiday_id = int(new_id_var.getvalue()[0])
    cursor.close()
    conn.close()
    return holiday_id
