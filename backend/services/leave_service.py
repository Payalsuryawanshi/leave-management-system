import oracledb
from datetime import datetime
from fastapi import HTTPException
from db import get_connection
from services.calendar_service import count_working_days


# ─── Balance ──────────────────────────────────────────────────────

def sync_leave_balances(cursor, year: int, type_id: int = None, user_id: int = None) -> None:
    """Keep LEAVE_BALANCE totals aligned with live active LEAVE_TYPES quotas.

    HR quota edits update LEAVE_TYPES first; this sync updates existing balance rows
    and creates missing rows so dashboards no longer depend on stale seeded totals.
    """
    filters = ["lt.is_active = 1", "u.role = 'employee'"]
    params = {"year": year}
    if type_id is not None:
        filters.append("lt.type_id = :type_id")
        params["type_id"] = type_id
    if user_id is not None:
        filters.append("u.user_id = :user_id")
        params["user_id"] = user_id
    filter_sql = " AND ".join(filters)

    cursor.execute(
        f"""UPDATE LEAVE_BALANCE lb
            SET lb.total = (
                SELECT lt.quota_per_year
                FROM LEAVE_TYPES lt
                WHERE lt.type_id = lb.type_id AND lt.is_active = 1
            )
            WHERE lb.year = :year
            AND EXISTS (
                SELECT 1
                FROM USERS u
                JOIN LEAVE_TYPES lt ON lt.type_id = lb.type_id
                WHERE u.user_id = lb.user_id
                AND {filter_sql}
            )""",
        params
    )

    cursor.execute(
        f"""INSERT INTO LEAVE_BALANCE (balance_id, user_id, type_id, year, total, used)
            SELECT BALANCE_SEQ.NEXTVAL, u.user_id, lt.type_id, :year, lt.quota_per_year, 0
            FROM USERS u
            CROSS JOIN LEAVE_TYPES lt
            WHERE {filter_sql}
            AND NOT EXISTS (
                SELECT 1
                FROM LEAVE_BALANCE lb
                WHERE lb.user_id = u.user_id
                AND lb.type_id = lt.type_id
                AND lb.year = :year
            )""",
        params
    )


def get_leave_balance(user_id: int, type_id: int, year: int) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    sync_leave_balances(cursor, year, type_id=type_id, user_id=user_id)
    conn.commit()
    cursor.execute(
          """SELECT total, used, (total - used) as remaining
              FROM LEAVE_BALANCE
              WHERE user_id = :1 AND type_id = :2 AND year = :3""",
          [user_id, type_id, year]
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row:
        return {"total": row[0], "used": row[1], "remaining": row[2]}
    return None


def get_all_balances(user_id: int, year: int) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    sync_leave_balances(cursor, year, user_id=user_id)
    conn.commit()
    cursor.execute(
          """SELECT lt.name, lb.total, lb.used, (lb.total - lb.used) as remaining
              FROM LEAVE_BALANCE lb
              JOIN LEAVE_TYPES lt ON lb.type_id = lt.type_id
              WHERE lb.user_id = :1 AND lb.year = :2 AND lt.is_active = 1""",
          [user_id, year]
    )
    results = []
    for row in cursor.fetchall():
        results.append({
            "type_name": row[0],
            "total":     row[1],
            "used":      row[2],
            "remaining": row[3]
        })
    cursor.close()
    conn.close()
    return results


# ─── Leave Application ────────────────────────────────────────────

def create_leave_application(user_id: int, leave_data: dict) -> int:
    # Calculate working days
    days = count_working_days(leave_data["start_date"], leave_data["end_date"])
    if days == 0:
        raise HTTPException(status_code=400, detail="No working days in selected range")

    conn = get_connection()
    cursor = conn.cursor()

    # Check balance
    cursor.execute(
        """SELECT remaining FROM LEAVE_BALANCE
           WHERE user_id = :1 AND type_id = :2 AND year = EXTRACT(YEAR FROM SYSDATE)""",
        [user_id, leave_data["type_id"]]
    )
    row = cursor.fetchone()
    if not row or row[0] < days:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Insufficient leave balance")

    # Insert leave (use sequence CURRVAL to retrieve generated ID)
    cursor.execute(
        """INSERT INTO LEAVES (leave_id, user_id, type_id, start_date, end_date, days_count, reason, status, applied_at)
           VALUES (LEAVE_SEQ.NEXTVAL, :1, :2, :3, :4, :5, :6, 'Pending', CURRENT_TIMESTAMP)""",
        [user_id, leave_data["type_id"], leave_data["start_date"], leave_data["end_date"], days, leave_data["reason"]]
    )
    # retrieve the generated leave_id
    cursor.execute("SELECT LEAVE_SEQ.CURRVAL FROM DUAL")
    leave_id = int(cursor.fetchone()[0])
    conn.commit()
    cursor.close()
    conn.close()
    return leave_id


def get_user_leave_history(user_id: int) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
          """SELECT l.leave_id, lt.name, l.start_date, l.end_date, l.days_count, l.reason, l.status, l.applied_at
              FROM LEAVES l
              JOIN LEAVE_TYPES lt ON l.type_id = lt.type_id
              WHERE l.user_id = :1
              ORDER BY l.applied_at DESC""",
          [user_id]
    )
    results = []
    for row in cursor.fetchall():
        results.append({
            "leave_id":   row[0],
            "type_name":  row[1],
            "start_date": row[2].date() if hasattr(row[2], 'date') else row[2],
            "end_date":   row[3].date() if hasattr(row[3], 'date') else row[3],
            "days_count": row[4],
            "reason":     row[5],
            "status":     row[6],
            "applied_at": row[7]
        })
    cursor.close()
    conn.close()
    return results


def cancel_leave(leave_id: int, user_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE LEAVES SET status = 'Cancelled' WHERE leave_id = :1 AND user_id = :2 AND status = 'Pending'",
        [leave_id, user_id]
    )
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected > 0


# ─── Manager Actions ──────────────────────────────────────────────

def get_pending_approvals(manager_id: int) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
          """SELECT l.leave_id, u.name, u.email, lt.name, l.start_date, l.end_date, l.days_count, l.reason, l.applied_at
              FROM LEAVES l
              JOIN USERS u ON l.user_id = u.user_id
              JOIN LEAVE_TYPES lt ON l.type_id = lt.type_id
              WHERE u.manager_id = :1 AND l.status = 'Pending'
              ORDER BY l.applied_at ASC""",
          [manager_id]
    )
    results = []
    for row in cursor.fetchall():
        results.append({
            "leave_id":       row[0],
            "employee_name":  row[1],
            "employee_email": row[2],
            "leave_type":     row[3],
            "start_date": row[4].date() if hasattr(row[4], 'date') else row[4],
            "end_date":   row[5].date() if hasattr(row[5], 'date') else row[5],
            "days_count": row[6],
            "reason":     row[7],
            "applied_at": row[8]
        })
    cursor.close()
    conn.close()
    return results


def approve_leave(leave_id: int, manager_id: int, comment: str = None) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT user_id, type_id, days_count, status FROM LEAVES WHERE leave_id = :1",
            [leave_id]
        )
        leave = cursor.fetchone()
        if not leave or leave[3] != 'Pending':
            return False
        user_id, type_id, days_count, _ = leave

        cursor.execute(
            "UPDATE LEAVES SET status = 'Approved' WHERE leave_id = :1",
            [leave_id]
        )
        cursor.execute(
            """UPDATE LEAVE_BALANCE SET used = used + :1
               WHERE user_id = :2 AND type_id = :3 AND year = EXTRACT(YEAR FROM SYSDATE)""",
            [days_count, user_id, type_id]
        )
        cursor.execute(
            """INSERT INTO APPROVALS (approval_id, leave_id, manager_id, approval_action, manager_comment, actioned_at)
               VALUES (APPROVAL_SEQ.NEXTVAL, :1, :2, 'Approved', :3, CURRENT_TIMESTAMP)""",
            [leave_id, manager_id, comment]
        )
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


def reject_leave(leave_id: int, manager_id: int, comment: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT status FROM LEAVES WHERE leave_id = :1",
            [leave_id]
        )
        row = cursor.fetchone()
        if not row or row[0] != 'Pending':
            return False

        cursor.execute(
            "UPDATE LEAVES SET status = 'Rejected' WHERE leave_id = :1",
            [leave_id]
        )
        cursor.execute(
            """INSERT INTO APPROVALS (approval_id, leave_id, manager_id, approval_action, manager_comment, actioned_at)
               VALUES (APPROVAL_SEQ.NEXTVAL, :1, :2, 'Rejected', :3, CURRENT_TIMESTAMP)""",
            [leave_id, manager_id, comment]
        )
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


# ─── HR Admin ─────────────────────────────────────────────────────

def get_leave_types() -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT type_id, name, description, quota_per_year, is_active FROM LEAVE_TYPES WHERE is_active = 1"
    )
    results = []
    for row in cursor.fetchall():
        results.append({
            "type_id":       row[0],
            "name":          row[1],
            "description":   row[2],
            "quota_per_year": row[3],
            "is_active":     bool(row[4])
        })
    cursor.close()
    conn.close()
    return results


def create_leave_type(name: str, description: str, quota: int) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO LEAVE_TYPES (type_id, name, description, quota_per_year, is_active)
           VALUES (LTYPE_SEQ.NEXTVAL, :1, :2, :3, 1)""",
        [name, description, quota]
    )
    cursor.execute("SELECT LTYPE_SEQ.CURRVAL FROM DUAL")
    type_id = int(cursor.fetchone()[0])
    # New active leave types should be immediately available on employee dashboards.
    sync_leave_balances(cursor, datetime.today().year, type_id=type_id)
    conn.commit()
    cursor.close()
    conn.close()
    return type_id


def update_leave_type_quota(type_id: int, quota: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE LEAVE_TYPES SET quota_per_year = :1 WHERE type_id = :2",
            [quota, type_id]
        )
        affected = cursor.rowcount
        if affected:
            # Recalculate persisted totals so remaining = updated quota - used leaves.
            sync_leave_balances(cursor, datetime.today().year, type_id=type_id)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
    return affected > 0


def get_leave_reports() -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT u.department, lt.name, l.status, COUNT(*) as requests, SUM(l.days_count) as total_days
           FROM LEAVES l
           JOIN USERS u ON l.user_id = u.user_id
           JOIN LEAVE_TYPES lt ON l.type_id = lt.type_id
           -- HR reports need the dynamic leave status from each leave record.
           -- Grouping by status keeps Approved/Pending/Rejected/Cancelled totals separate.
           GROUP BY u.department, lt.name, l.status
           ORDER BY u.department, lt.name, l.status"""
    )
    results = []
    for row in cursor.fetchall():
        status = row[2] or "Pending"
        results.append({
            "department": row[0],
            "leave_type": row[1],
            "status":     status.title(),
            "requests":   row[3],
            "total_days": row[4]
        })
    cursor.close()
    conn.close()
    return results
