import api from "./api";

// Employee
export const getBalance = () => api.get("/leaves/balance");
export const applyLeave = (data) => api.post("/leaves/apply", data);
export const getMyHistory = () => api.get("/leaves/my-history");
export const getTeamCalendar = () => api.get("/leaves/team-calendar");
export const cancelLeave = (id) => api.put(`/leaves/${id}/cancel`);

// Manager
export const getPending = () => api.get("/manager/pending");
export const approveLeave = (id, data) => api.put(`/manager/leaves/${id}/approve`, data);
export const rejectLeave = (id, data) => api.put(`/manager/leaves/${id}/reject`, data);

// HR Admin
export const getLeaveTypes = () => api.get("/admin/leave-types");
export const createLeaveType = (data) => api.post("/admin/leave-types", data);
export const updateLeaveType = (id, data) => api.put(`/admin/leave-types/${id}`, data);
export const getReports = () => api.get("/admin/reports");
export const getHolidays = () => api.get("/admin/holidays");
export const createHoliday = (data) => api.post("/admin/holidays", data);