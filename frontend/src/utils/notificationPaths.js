const ADMIN_PATH_BY_ROLE = {
  promoter: {
    '/admin/content': '/promoter/promoter-announcement',
    '/admin/events': '/promoter/promoter-eventmanagement',
    '/admin/payments': '/promoter/promoter-payouts',
    '/admin/support': '/promoter/support',
    '/admin/users': '/promoter/settings',
  },
  sponsor: {
    '/admin/content': '/sponsor',
    '/admin/events': '/sponsor/sponsor-events',
    '/admin/payments': '/sponsor/sponsor-invoices',
    '/admin/support': '/sponsor/support',
    '/admin/users': '/sponsor/settings',
  },
  customer: {
    '/admin/content': '/customer',
    '/admin/events': '/customer/browse-events',
    '/admin/payments': '/customer/history',
    '/admin/support': '/customer/support',
    '/admin/users': '/customer/settings',
  },
};

const PATH_CORRECTIONS = {
  '/promoter/events': '/promoter/promoter-events',
  '/sponsor/orders': '/sponsor/store',
};

const TYPE_DEFAULTS = {
  admin: {
    concern: '/admin/support',
    payment: '/admin/payments',
    event: '/admin/events',
    user: '/admin/users',
    update: '/admin/content',
    announcement: '/admin/content',
    policy: '/admin/content',
    reservation: '/admin/payments',
  },
  promoter: {
    concern: '/promoter/support',
    payment: '/promoter/promoter-payouts',
    event: '/promoter/promoter-eventmanagement',
    user: '/promoter/settings',
    update: '/promoter/promoter-announcement',
    announcement: '/promoter/promoter-announcement',
    policy: '/promoter/promoter-announcement',
    reservation: '/promoter/promoter-events',
  },
  sponsor: {
    concern: '/sponsor/support',
    payment: '/sponsor/sponsor-invoices',
    event: '/sponsor/sponsor-events',
    user: '/sponsor/settings',
    update: '/sponsor',
    announcement: '/sponsor',
    policy: '/sponsor',
    reservation: '/sponsor/sponsor-my-booths',
  },
  customer: {
    concern: '/customer/support',
    payment: '/customer/history',
    event: '/customer/browse-events',
    user: '/customer/settings',
    update: '/customer',
    announcement: '/customer',
    policy: '/customer',
    reservation: '/customer/my-ticketsorder',
  },
};

const normalizeRole = (role) => {
  if (role === 'admin' || role === 'superadmin') return 'admin';
  return role;
};

const rolePrefix = (roleKey) => (roleKey === 'admin' ? '/admin' : `/${roleKey}`);

export const getNotificationPath = (notif, role) => {
  const roleKey = normalizeRole(role);
  let path = notif?.path;

  if (path && PATH_CORRECTIONS[path]) {
    path = PATH_CORRECTIONS[path];
  }

  if (path?.startsWith(rolePrefix(roleKey))) {
    return path;
  }

  if (path && ADMIN_PATH_BY_ROLE[roleKey]?.[path]) {
    return ADMIN_PATH_BY_ROLE[roleKey][path];
  }

  if (path && roleKey !== 'admin' && path.startsWith('/admin/')) {
    const mapped = ADMIN_PATH_BY_ROLE[roleKey]?.[path];
    if (mapped) return mapped;
  }

  return TYPE_DEFAULTS[roleKey]?.[notif?.type] || path || rolePrefix(roleKey);
};
