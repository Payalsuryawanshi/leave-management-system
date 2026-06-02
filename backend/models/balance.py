from pydantic import BaseModel
from typing import List, Optional

class LeaveBalanceSummary(BaseModel):
    type_name: str
    total: int
    used: int
    remaining: int

class TeamLeaveEntry(BaseModel):
    employee_name: str
    leave_type: str
    start_date: str
    end_date: str
    days_count: int
    status: str

class ReportEntry(BaseModel):
    department: str
    leave_type: str
    count: int
    total_days: int