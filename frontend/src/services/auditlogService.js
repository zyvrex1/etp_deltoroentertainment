import api from './api';

export const fetchAuditLogs = async ({
  token,
  page = 1,
  limit = 7,
  search = '',
  startDate,
  endDate,
} = {}) => {
  const params = new URLSearchParams({ page, limit });

  if (search)    params.set('search', search);
  if (startDate) params.set('startDate', startDate.toISOString());
  if (endDate)   params.set('endDate', endDate.toISOString());

  const response = await api.get(`/audit-logs?${params.toString()}`);
  return response.data;
};