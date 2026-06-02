from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from datetime import date
from models.leave import LeaveApply
from services.auth_service import get_current_user, require_role
from services.calendar_service import count_working_days, get_team_calendar
from services.leave_service import (
    get_all_balances, create_leave_application,
    get_user_leave_history, cancel_leave,
    get_leave_balance
)

router = APIRouter(prefix="/leaves", tags=["Leaves"])

@router.get("/balance")
async def get_balance(current_user: Annotated[dict, Depends(get_current_user)]):
    return get_all_balances(current_user["user_id"], date.today().year)

@router.post("/apply", status_code=status.HTTP_201_CREATED)
async def apply_leave(
    leave_data: LeaveApply,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    working_days = count_working_days(leave_data.start_date, leave_data.end_date)
    if working_days == 0:
        raise HTTPException(status_code=400, detail="No working days in selected range")

    balance = get_leave_balance(current_user["user_id"], leave_data.type_id, date.today().year)
    if not balance or balance["remaining"] < working_days:
        raise HTTPException(status_code=400, detail="Insufficient leave balance")

    leave_dict = leave_data.model_dump()
    leave_dict["days_count"] = working_days
    leave_id = create_leave_application(current_user["user_id"], leave_dict)
    return {"message": "Leave application submitted", "leave_id": leave_id}

@router.get("/my-history")
async def get_leave_history(current_user: Annotated[dict, Depends(get_current_user)]):
    return get_user_leave_history(current_user["user_id"])

@router.get("/team-calendar")
async def get_team_calendar_view(
    current_user: Annotated[dict, Depends(require_role("employee", "manager", "hr"))]
):
    return get_team_calendar(current_user)

@router.put("/{leave_id}/cancel")
async def cancel_leave_request(
    leave_id: int,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    success = cancel_leave(leave_id, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=400, detail="Cannot cancel. Leave may already be processed.")
    return {"message": "Leave cancelled successfully"}
