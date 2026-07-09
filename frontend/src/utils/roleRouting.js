/**
 * Centralized role routing configuration.
 * All role-based route permissions and nav links are defined here.
 * To add/edit role routes, update the ROLE_ROUTES map below.
 */

export const VALID_ROLES = ['super_admin', 'admin', 'customer_admin', 'driver'];

/**
 * ROLE_ROUTES — single source of truth for role-based navigation.
 * Each role maps to an array of { path, label } objects.
 * The first entry is treated as the role's "dashboard" / home route.
 */
export const ROLE_ROUTES = {
  super_admin: [
    { path: '/admin-dashboard', label: 'Painel' },
    { path: '/admin-dashboard/organizations', label: 'Organizações' },
    { path: '/admin-dashboard/organization-banks', label: 'Bancos' },
    { path: '/admin-dashboard/vehicles', label: 'Veículos' },
    { path: '/admin-dashboard/drivers', label: 'Coletores' },
    { path: '/admin-dashboard/reports', label: 'Relatórios' },
  ],
  admin: [
    { path: '/admin-dashboard', label: 'Painel' },
    { path: '/admin-dashboard/my-organization', label: 'Minha organização' },
    { path: '/admin-dashboard/users', label: 'Usuários' },
    { path: '/admin-dashboard/billing', label: 'Cobranças' },
    { path: '/admin-dashboard/my-billing', label: 'Minha fatura' },
    { path: '/admin-dashboard/vehicles', label: 'Veículos' },
    { path: '/admin-dashboard/drivers', label: 'Coletores' },
    { path: '/admin-dashboard/contact', label: 'Contato' },
  ],
  customer_admin: [
    { path: '/customer-dashboard', label: 'Painel' },
    { path: '/schedule', label: 'Agenda' },
    { path: '/upload-waste', label: 'Solicitar coleta' },
    { path: '/billing', label: 'Cobranças' },
  ],
  driver: [
    { path: '/driver-dashboard', label: 'Painel' },
  ],
};

/**
 * Get the dashboard (home) route for a given user role.
 * Returns the first route in the role's ROLE_ROUTES array.
 * @param {string} role - User role
 * @returns {string} - Dashboard route path
 */
export const getDashboardRoute = (role) => {
  const routes = ROLE_ROUTES[role];
  return routes?.[0]?.path || '/';
};

/**
 * Check if a role has access to a route.
 * @param {string} userRole - User's role
 * @param {string} route - Route path to check
 * @returns {boolean} - Whether user has access
 */
export const hasRouteAccess = (userRole, route) => {
  const routes = ROLE_ROUTES[userRole];
  if (!routes) return false;
  return routes.some(({ path }) => route.startsWith(path));
};

/**
 * Get nav links for a given role (for Navbar rendering).
 * @param {string} role - User role
 * @returns {{ path: string, label: string }[]}
 */
export const getNavLinks = (role) => {
  return ROLE_ROUTES[role] || [];
};
