from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, Optional
from models.leave import ApprovalAction
from services.auth_service import require_role
from services.leave_service import get_pending_approvals, approve_leave, reject_leave

router = APIRouter(prefix="/manager", tags=["Manager"])

@router.get("/pending")
async def get_pending_requests(
    current_user: Annotated[dict, Depends(require_role("manager", "hr"))]
):
    return get_pending_approvals(current_user["user_id"])

@router.put("/leaves/{leave_id}/approve")
async def approve_leave_request(
    leave_id: int,
    action: ApprovalAction,
    current_user: Annotated[dict, Depends(require_role("manager", "hr"))]
):
    success = approve_leave(leave_id, current_user["user_id"], action.comment)
    if not success:
        raise HTTPException(status_code=400, detail="Could not approve. Leave may not be pending.")
    return {"message": "Leave approved successfully"}

@router.put("/leaves/{leave_id}/reject")
async def reject_leave_request(
    leave_id: int,
    action: ApprovalAction,
    current_user: Annotated[dict, Depends(require_role("manager", "hr"))]
):
    if not action.comment or not action.comment.strip():
        raise HTTPException(status_code=400, detail="Comment is required for rejection")
    success = reject_leave(leave_id, current_user["user_id"], action.comment.strip())
    if not success:
        raise HTTPException(status_code=400, detail="Could not reject. Leave may not be pending.")
    return {"message": "Leave rejected successfully"}