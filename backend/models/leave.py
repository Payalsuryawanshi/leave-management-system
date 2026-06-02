from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import date, datetime

class LeaveApply(BaseModel):
    type_id: int
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=10, max_length=500)

    @validator('end_date')
    def end_date_must_be_after_start(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('End date must be after start date')
        return v

class LeaveResponse(BaseModel):
    leave_id: int
    user_id: int
    type_id: int
    type_name: str
    start_date: date
    end_date: date
    days_count: int
    reason: str
    status: str
    applied_at: datetime

    class Config:
        from_attributes = True

class LeaveBalanceResponse(BaseModel):
    type_name: str
    total: int
    used: int
    remaining: int

class ApprovalAction(BaseModel):
    comment: Optional[str] = None

class LeaveTypeCreate(BaseModel):
    name: str = Field(..., max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    quota_per_year: int = Field(..., gt=0)

class LeaveTypeUpdate(BaseModel):
    quota_per_year: int = Field(..., gt=0)

class HolidayCreate(BaseModel):
    name: str = Field(..., max_length=100)
    date: str  # YYYY-MM-DD format
    is_optional: bool = False

class HolidayResponse(BaseModel):
    holiday_id: int
    name: str
    date_col: date
    is_optional: bool

    class Config:
        from_attributes = True