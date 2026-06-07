export const filterNotificationsForRole = (notifications, role) => {
  const isAdmin = role === 'admin' || role === 'superadmin';
  if (isAdmin) return notifications;
  return notifications.filter((n) => n.type !== 'user');
};
