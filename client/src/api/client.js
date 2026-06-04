import axios from 'axios';

export const API_URL = 'http://localhost:5000/api';
export const TOKEN_KEY = 'mandal_token';

export const getAuthConfig = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

/* ============ AUTH ============ */
export const loginAPI          = (data) => axios.post(`${API_URL}/auth/login`, data);
export const registerAPI       = (data) => axios.post(`${API_URL}/auth/register`, data);
export const forgotPasswordAPI = (data) => axios.post(`${API_URL}/auth/forgot-password`, data);
export const resetPasswordAPI  = (data) => axios.post(`${API_URL}/auth/reset-password`, data);

/* ============ MEMBERS ============ */
export const fetchMembers    = ()                      => axios.get(`${API_URL}/members`, getAuthConfig());
export const createMemberAPI = (data)                  => axios.post(`${API_URL}/members`, data, getAuthConfig());
export const updateMemberAPI = (id, data)              => axios.put(`${API_URL}/members/${id}`, data, getAuthConfig());
export const deleteMemberAPI = (id)                    => axios.delete(`${API_URL}/members/${id}`, getAuthConfig());

/* ============ ENTRIES ============ */
export const fetchEntries         = ()                            => axios.get(`${API_URL}/entries`, getAuthConfig());
export const createEntryAPI       = (data)                        => axios.post(`${API_URL}/entries`, data, getAuthConfig());
export const fetchEntriesByMonth  = (month)                       => axios.get(`${API_URL}/entries/month/${month}`, getAuthConfig());
export const deleteEntryAPI       = (id)                          => axios.delete(`${API_URL}/entries/${id}`, getAuthConfig());

/* ============ LOANS ============ */
export const fetchLoans    = (params) => axios.get(`${API_URL}/loans`,     { ...getAuthConfig(), params });
export const createLoanAPI = (data)   => axios.post(`${API_URL}/loans`,     data, getAuthConfig());
export const updateLoanAPI = (id, d)  => axios.put(`${API_URL}/loans/${id}`, d, getAuthConfig());
export const deleteLoanAPI = (id)     => axios.delete(`${API_URL}/loans/${id}`, getAuthConfig());
export const fetchLoanStats = ()     => axios.get(`${API_URL}/loans/stats/summary`, getAuthConfig());

/* ============ REPORTS ============ */
export const fetchDashboardStats = ()               => axios.get(`${API_URL}/reports/dashboard-stats`,  getAuthConfig());
export const fetchMonthlyTrend   = ()               => axios.get(`${API_URL}/reports/monthly-trend`,    getAuthConfig());
export const fetchMonthlyReport  = (month)           => axios.get(`${API_URL}/reports/monthly?month=${month}`, getAuthConfig());
export const fetchYearlyReport   = (year)            => axios.get(`${API_URL}/reports/yearly?year=${year}`,    getAuthConfig());
export const fetchMemberLedger   = (memberId)        => axios.get(`${API_URL}/reports/member/${memberId}`,       getAuthConfig());
export const fetchReportByMember = (memberId)        => axios.get(`${API_URL}/reports/member/${memberId}`,       getAuthConfig());
