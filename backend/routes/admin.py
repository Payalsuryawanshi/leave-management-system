from db import get_connection
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from models.leave import LeaveTypeCreate, LeaveTypeUpdate, HolidayCreate
from services.auth_service import require_role
from services.leave_service import (
    get_leave_types, create_leave_type,
    update_leave_type_quota, get_leave_reports
)
from services.calendar_service import get_holidays, create_holiday

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/leave-types")
async def get_leave_types_endpoint(
    current_user: Annotated[dict, Depends(require_role("hr"))]
):
    return get_leave_types()

@router.post("/leave-types", status_code=status.HTTP_201_CREATED)
async def create_leave_type_endpoint(
    leave_type: LeaveTypeCreate,
    current_user: Annotated[dict, Depends(require_role("hr"))]
):
    type_id = create_leave_type(leave_type.name, leave_type.description, leave_type.quota_per_year)
    return {"message": "Leave type created", "type_id": type_id}

@router.put("/leave-types/{type_id}")
async def update_leave_type_endpoint(
    type_id: int,
    update_data: LeaveTypeUpdate,
    current_user: Annotated[dict, Depends(require_role("hr"))]
):
    success = update_leave_type_quota(type_id, update_data.quota_per_year)
    if not success:
        raise HTTPException(status_code=404, detail="Leave type not found")
    return {"message": "Leave type updated"}

@router.get("/reports")
async def get_admin_reports(
    current_user: Annotated[dict, Depends(require_role("hr"))]
):
    return get_leave_reports()

@router.get("/holidays")
async def get_holidays_endpoint(
    current_user: Annotated[dict, Depends(require_role("hr"))]
):
    return get_holidays()

@router.post("/holidays", status_code=status.HTTP_201_CREATED)
async def create_holiday_endpoint(
    holiday: HolidayCreate,
    current_user: Annotated[dict, Depends(require_role("hr"))]
):
    holiday_id = create_holiday(holiday.name, holiday.date, holiday.is_optional)
    return {"message": "Holiday added", "holiday_id": holiday_id}

@router.delete("/leave-types/{type_id}")
async def delete_leave_type(
    type_id: int,
    current_user: Annotated[dict, Depends(require_role("hr"))]
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE LEAVE_TYPES SET is_active = 0 WHERE type_id = :tid", {"tid": type_id})
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Leave type deactivated"}

@router.delete("/holidays/{holiday_id}")
async def delete_holiday(
    holiday_id: int,
    current_user: Annotated[dict, Depends(require_role("hr"))]
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM HOLIDAYS WHERE holiday_id = :hid", {"hid": holiday_id})
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Holiday deleted"}

@router.put("/holidays/{holiday_id}")
async def update_holiday(
    holiday_id: int,
    holiday: HolidayCreate,
    current_user: Annotated[dict, Depends(require_role("hr"))]
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """UPDATE HOLIDAYS
           SET name = :hname,
               date_col = TO_DATE(:hdate, 'YYYY-MM-DD'),
               is_optional = :hopt
           WHERE holiday_id = :hid""",
        {
            "hname": holiday.name,
            "hdate": holiday.date,
            "hopt": 1 if holiday.is_optional else 0,
            "hid": holiday_id
        }
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Holiday updated"}
